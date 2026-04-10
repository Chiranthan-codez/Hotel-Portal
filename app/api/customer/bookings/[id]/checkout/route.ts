import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCustomerSession } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCustomerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = await getDb();

    // Verify this booking belongs to this customer
    const [bookings] = await db.execute(`
      SELECT b.*, r.price_per_day, c.name as customer_name
      FROM bookings b
      JOIN rooms r ON b.room_number = r.room_number
      JOIN customers c ON b.customer_id = c.id
      WHERE b.id = ? AND b.status = 'ACTIVE'
        AND b.customer_id IN (SELECT customer_id FROM customer_accounts WHERE id = ? AND customer_id IS NOT NULL)
    `, [id, session.id]) as any[];

    if (!bookings.length) return NextResponse.json({ error: 'Booking not found or not authorized' }, { status: 404 });
    const booking = bookings[0];

    const today = new Date().toISOString().split('T')[0];
    const checkIn = new Date(booking.check_in_date);
    const checkOut = new Date(today);
    let nights = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    if (nights <= 0) nights = 1;
    const totalBill = nights * booking.price_per_day;

    await db.execute(
      'UPDATE bookings SET check_out_date = ?, status = ?, total_bill = ? WHERE id = ?',
      [today, 'CHECKED_OUT', totalBill, id]
    );
    await db.execute('UPDATE rooms SET available = TRUE WHERE room_number = ?', [booking.room_number]);

    return NextResponse.json({
      success: true,
      booking_id: id,
      room_number: booking.room_number,
      customer_name: booking.customer_name,
      check_in_date: booking.check_in_date,
      check_out_date: today,
      nights,
      total_bill: totalBill,
      price_per_day: booking.price_per_day,
      payment_status: booking.payment_status,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
