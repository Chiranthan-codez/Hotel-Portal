import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const payMethod = body.method || 'CASH';

    const db = await getDb();

    const [bookings] = await db.execute(
      'SELECT b.*, r.price_per_day, c.name as customer_name FROM bookings b JOIN customers c ON b.customer_id = c.id JOIN rooms r ON b.room_number = r.room_number WHERE b.id = ?',
      [id]
    ) as any[];

    if (!bookings.length) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (bookings[0].payment_status === 'PAID') return NextResponse.json({ error: 'Already paid' }, { status: 400 });

    const booking = bookings[0];

    // Calculate total_bill if it's missing or zero
    let totalBill = Number(booking.total_bill) || 0;
    if (totalBill === 0 && booking.price_per_day) {
      const checkIn = new Date(booking.check_in_date);
      const checkOut = booking.check_out_date ? new Date(booking.check_out_date) : new Date();
      let nights = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      if (nights <= 0) nights = 1;
      totalBill = nights * booking.price_per_day;

      // Update the booking's total_bill in DB so it persists
      await db.execute('UPDATE bookings SET total_bill = ? WHERE id = ?', [totalBill, id]);
    }

    const payAmount = body.amount != null && body.amount > 0 ? body.amount : totalBill;
    const ref = `ADM-TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Find linked customer account (if any)
    const [accounts] = await db.execute(
      'SELECT id FROM customer_accounts WHERE customer_id = ? LIMIT 1',
      [booking.customer_id]
    ) as any[];
    const accountId = accounts.length ? accounts[0].id : null;

    await db.execute(
      'INSERT INTO payments (booking_id, customer_account_id, amount, method, status, transaction_ref) VALUES (?, ?, ?, ?, ?, ?)',
      [id, accountId, payAmount, payMethod, 'COMPLETED', ref]
    );

    await db.execute('UPDATE bookings SET payment_status = ? WHERE id = ?', ['PAID', id]);

    return NextResponse.json({
      success: true,
      transaction_ref: ref,
      amount: payAmount,
      total_bill: totalBill,
      method: payMethod,
      customer_name: booking.customer_name,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
