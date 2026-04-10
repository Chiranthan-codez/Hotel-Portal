import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCustomerSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getCustomerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = await getDb();
    // Get bookings linked to this customer account
    const [rows] = await db.execute(`
      SELECT b.id, b.room_number, b.check_in_date, b.check_out_date, b.status,
             b.total_bill, b.payment_status,
             r.room_type, r.price_per_day,
             c.name as customer_name, c.contact,
             p.method as payment_method, p.paid_at, p.transaction_ref
      FROM bookings b
      JOIN rooms r ON b.room_number = r.room_number
      JOIN customers c ON b.customer_id = c.id
      LEFT JOIN payments p ON p.booking_id = b.id
      WHERE b.customer_id IN (
        SELECT customer_id FROM customer_accounts WHERE id = ? AND customer_id IS NOT NULL
      )
      ORDER BY b.id DESC
    `, [session.id]) as any[];
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCustomerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { room_number, check_in_date } = await req.json();
    if (!room_number) return NextResponse.json({ error: 'Please select a room' }, { status: 400 });

    const db = await getDb();

    // Check room available
    const [rooms] = await db.execute('SELECT * FROM rooms WHERE room_number = ?', [room_number]) as any[];
    if (!rooms.length) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    if (!rooms[0].available) return NextResponse.json({ error: `Room ${room_number} is already occupied` }, { status: 400 });
    // Check housekeeping status
    const [hk] = await db.execute('SELECT status FROM housekeeping WHERE room_number = ?', [room_number]) as any[];
    if (hk.length && hk[0].status !== 'CLEAN') {
      return NextResponse.json({ error: `Room ${room_number} needs cleaning and is temporarily unavailable` }, { status: 400 });
    }

    const today = check_in_date || new Date().toISOString().split('T')[0];

    // Get or create customer record linked to this account
    let customerId = session.customer_id;
    if (!customerId) {
      // Create a new customer record
      const [acc] = await db.execute('SELECT name, contact FROM customer_accounts WHERE id = ?', [session.id]) as any[];
      if (!acc.length) return NextResponse.json({ error: 'Account not found' }, { status: 404 });
      const [custRes] = await db.execute(
        'INSERT INTO customers (name, contact, room_number, check_in_date) VALUES (?, ?, ?, ?)',
        [acc[0].name, acc[0].contact || '0000000', room_number, today]
      ) as any[];
      customerId = custRes.insertId;
      // Link account to customer
      await db.execute('UPDATE customer_accounts SET customer_id = ? WHERE id = ?', [customerId, session.id]);
    } else {
      // Update customer's current room
      await db.execute('UPDATE customers SET room_number = ?, check_in_date = ? WHERE id = ?', [room_number, today, customerId]);
    }

    const [bookRes] = await db.execute(
      'INSERT INTO bookings (customer_id, room_number, check_in_date, status, payment_status) VALUES (?, ?, ?, ?, ?)',
      [customerId, room_number, today, 'ACTIVE', 'UNPAID']
    ) as any[];

    await db.execute('UPDATE rooms SET available = FALSE WHERE room_number = ?', [room_number]);

    return NextResponse.json({
      success: true,
      booking_id: bookRes.insertId,
      room_number,
      room_type: rooms[0].room_type,
      price_per_day: rooms[0].price_per_day,
      check_in_date: today,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
