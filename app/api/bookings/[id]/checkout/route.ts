import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = await getDb();

    const [bookings] = await db.execute(
      'SELECT b.*, r.price_per_day, c.name as customer_name FROM bookings b JOIN rooms r ON b.room_number = r.room_number JOIN customers c ON b.customer_id = c.id WHERE b.id = ? AND b.status = ?',
      [id, 'ACTIVE']
    ) as any[];

    if (!bookings.length) return NextResponse.json({ error: 'Active booking not found' }, { status: 404 });
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
    // Room stays unavailable until housekeeping marks it clean
    await db.execute('UPDATE rooms SET available = FALSE WHERE room_number = ?', [booking.room_number]);
    // Set housekeeping status to NEEDS_CLEANING
    await db.execute(
      'INSERT INTO housekeeping (room_number, status) VALUES (?, ?) ON DUPLICATE KEY UPDATE status = ?',
      [booking.room_number, 'NEEDS_CLEANING', 'NEEDS_CLEANING']
    );

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
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
