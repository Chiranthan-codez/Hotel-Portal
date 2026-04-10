import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = await getDb();
    const [rows] = await db.execute(`
      SELECT b.id, b.room_number, b.check_in_date, b.check_out_date, b.status,
             CASE
               WHEN b.total_bill > 0 THEN b.total_bill
               WHEN b.check_out_date IS NOT NULL THEN r.price_per_day * GREATEST(DATEDIFF(b.check_out_date, b.check_in_date), 1)
               ELSE 0
             END as total_bill,
             b.payment_status,
             c.name as customer_name, c.contact, c.id as customer_id,
             r.room_type, r.price_per_day,
             ca.username as portal_username,
             p.method as payment_method, p.transaction_ref, p.paid_at
      FROM bookings b
      JOIN customers c ON b.customer_id = c.id
      JOIN rooms r ON b.room_number = r.room_number
      LEFT JOIN customer_accounts ca ON ca.customer_id = c.id
      LEFT JOIN payments p ON p.booking_id = b.id
      ORDER BY b.id DESC
    `) as any[];
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { customer_name, contact, room_number } = await req.json();
    if (!customer_name?.trim()) return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    if (!contact?.trim()) return NextResponse.json({ error: 'Contact number is required' }, { status: 400 });
    if (!/^\d{7,15}$/.test(contact.trim())) return NextResponse.json({ error: 'Contact must be 7-15 digits' }, { status: 400 });
    if (!room_number) return NextResponse.json({ error: 'Please select a room' }, { status: 400 });
    const db = await getDb();
    const [rooms] = await db.execute('SELECT * FROM rooms WHERE room_number = ?', [room_number]) as any[];
    if (!rooms.length) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    if (!rooms[0].available) return NextResponse.json({ error: `Room ${room_number} is already occupied` }, { status: 400 });
    // Check housekeeping status
    const [hk] = await db.execute('SELECT status FROM housekeeping WHERE room_number = ?', [room_number]) as any[];
    if (hk.length && hk[0].status !== 'CLEAN') {
      return NextResponse.json({ error: `Room ${room_number} needs cleaning before it can be booked` }, { status: 400 });
    }
    const today = new Date().toISOString().split('T')[0];
    const [custResult] = await db.execute(
      'INSERT INTO customers (name, contact, room_number, check_in_date) VALUES (?, ?, ?, ?)',
      [customer_name.trim(), contact.trim(), room_number, today]
    ) as any[];
    const customerId = custResult.insertId;
    const [bookResult] = await db.execute(
      'INSERT INTO bookings (customer_id, room_number, check_in_date, status, payment_status) VALUES (?, ?, ?, ?, ?)',
      [customerId, room_number, today, 'ACTIVE', 'UNPAID']
    ) as any[];
    await db.execute('UPDATE rooms SET available = FALSE WHERE room_number = ?', [room_number]);
    return NextResponse.json({
      success: true, booking_id: bookResult.insertId,
      room_number, room_type: rooms[0].room_type,
      price_per_day: rooms[0].price_per_day,
      customer_name: customer_name.trim(), check_in_date: today,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
