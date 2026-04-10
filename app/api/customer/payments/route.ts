import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCustomerSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getCustomerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { booking_id, method, amount } = await req.json();
    if (!booking_id || !method || !amount) return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });

    const db = await getDb();

    // Verify booking belongs to customer
    const [bookings] = await db.execute(`
      SELECT b.id, b.total_bill, b.payment_status, b.status
      FROM bookings b
      WHERE b.id = ?
        AND b.customer_id IN (SELECT customer_id FROM customer_accounts WHERE id = ? AND customer_id IS NOT NULL)
    `, [booking_id, session.id]) as any[];

    if (!bookings.length) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (bookings[0].payment_status === 'PAID') return NextResponse.json({ error: 'Already paid' }, { status: 400 });

    // Generate fake transaction ref
    const ref = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;

    await db.execute(
      'INSERT INTO payments (booking_id, customer_account_id, amount, method, status, transaction_ref) VALUES (?, ?, ?, ?, ?, ?)',
      [booking_id, session.id, amount, method, 'COMPLETED', ref]
    );

    await db.execute('UPDATE bookings SET payment_status = ? WHERE id = ?', ['PAID', booking_id]);

    return NextResponse.json({ success: true, transaction_ref: ref, amount, method });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getCustomerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await getDb();
    const [rows] = await db.execute(`
      SELECT p.*, b.room_number, b.check_in_date, b.check_out_date, r.room_type
      FROM payments p
      JOIN bookings b ON p.booking_id = b.id
      JOIN rooms r ON b.room_number = r.room_number
      WHERE p.customer_account_id = ?
      ORDER BY p.paid_at DESC
    `, [session.id]) as any[];

    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
