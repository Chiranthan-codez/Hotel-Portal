import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await getDb();

    const [[roomStats]] = await db.execute(`
      SELECT
        COUNT(*) as total_rooms,
        SUM(available = TRUE) as available_rooms,
        SUM(available = FALSE) as occupied_rooms
      FROM rooms
    `) as any[];

    const [[bookingStats]] = await db.execute(`
      SELECT
        COUNT(*) as total_bookings,
        SUM(status = 'ACTIVE') as active_bookings,
        SUM(status = 'CHECKED_OUT') as completed_bookings,
        COALESCE(SUM(CASE WHEN status = 'CHECKED_OUT' THEN
          CASE WHEN b.total_bill > 0 THEN b.total_bill
               ELSE r.price_per_day * GREATEST(DATEDIFF(b.check_out_date, b.check_in_date), 1)
          END
        ELSE 0 END), 0) as total_revenue
      FROM bookings b
      JOIN rooms r ON b.room_number = r.room_number
    `) as any[];

    const [revenueByType] = await db.execute(`
      SELECT r.room_type, COALESCE(SUM(
        CASE WHEN b.total_bill > 0 THEN b.total_bill
             ELSE r.price_per_day * GREATEST(DATEDIFF(b.check_out_date, b.check_in_date), 1)
        END
      ), 0) as revenue
      FROM rooms r
      LEFT JOIN bookings b ON r.room_number = b.room_number AND b.status = 'CHECKED_OUT'
      GROUP BY r.room_type
    `) as any[];

    const [recentBookings] = await db.execute(`
      SELECT b.id, b.room_number, b.check_in_date, b.check_out_date, b.status,
             CASE
               WHEN b.total_bill > 0 THEN b.total_bill
               WHEN b.check_out_date IS NOT NULL THEN r.price_per_day * GREATEST(DATEDIFF(b.check_out_date, b.check_in_date), 1)
               ELSE 0
             END as total_bill,
             c.name as customer_name, r.room_type
      FROM bookings b
      JOIN customers c ON b.customer_id = c.id
      JOIN rooms r ON b.room_number = r.room_number
      ORDER BY b.id DESC LIMIT 5
    `) as any[];

    return NextResponse.json({
      rooms: roomStats,
      bookings: bookingStats,
      revenue_by_type: revenueByType,
      recent_bookings: recentBookings,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
