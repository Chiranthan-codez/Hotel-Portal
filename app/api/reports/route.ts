import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await getDb();

    const [bookingsByMonth] = await db.execute(`
      SELECT DATE_FORMAT(b.check_in_date, '%Y-%m') as month,
             COUNT(*) as bookings,
             COALESCE(SUM(
               CASE WHEN b.total_bill > 0 THEN b.total_bill
                    ELSE r.price_per_day * GREATEST(DATEDIFF(b.check_out_date, b.check_in_date), 1)
               END
             ), 0) as revenue
      FROM bookings b
      JOIN rooms r ON b.room_number = r.room_number
      WHERE b.status = 'CHECKED_OUT'
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `) as any[];

    const [revenueByType] = await db.execute(`
      SELECT r.room_type,
             COUNT(b.id) as bookings,
             COALESCE(SUM(
               CASE WHEN b.total_bill > 0 THEN b.total_bill
                    ELSE r.price_per_day * GREATEST(DATEDIFF(b.check_out_date, b.check_in_date), 1)
               END
             ), 0) as revenue,
             COALESCE(SUM(GREATEST(DATEDIFF(b.check_out_date, b.check_in_date), 1)), 0) as nights
      FROM rooms r
      LEFT JOIN bookings b ON r.room_number = b.room_number AND b.status = 'CHECKED_OUT'
      GROUP BY r.room_type
    `) as any[];

    const [topRooms] = await db.execute(`
      SELECT b.room_number, r.room_type, r.price_per_day,
             COUNT(b.id) as bookings,
             COALESCE(SUM(
               CASE WHEN b.total_bill > 0 THEN b.total_bill
                    ELSE r.price_per_day * GREATEST(DATEDIFF(b.check_out_date, b.check_in_date), 1)
               END
             ), 0) as revenue
      FROM bookings b
      JOIN rooms r ON b.room_number = r.room_number
      WHERE b.status = 'CHECKED_OUT'
      GROUP BY b.room_number, r.room_type, r.price_per_day
      ORDER BY revenue DESC
      LIMIT 5
    `) as any[];

    const [[summary]] = await db.execute(`
      SELECT
        COUNT(*) as total_bookings,
        COALESCE(SUM(
          CASE WHEN b.total_bill > 0 THEN b.total_bill
               ELSE r.price_per_day * GREATEST(DATEDIFF(b.check_out_date, b.check_in_date), 1)
          END
        ), 0) as total_revenue,
        COALESCE(SUM(GREATEST(DATEDIFF(b.check_out_date, b.check_in_date), 1)), 0) as total_nights,
        COALESCE(AVG(
          CASE WHEN b.total_bill > 0 THEN b.total_bill
               ELSE r.price_per_day * GREATEST(DATEDIFF(b.check_out_date, b.check_in_date), 1)
          END
        ), 0) as avg_bill
      FROM bookings b
      JOIN rooms r ON b.room_number = r.room_number
      WHERE b.status = 'CHECKED_OUT'
    `) as any[];

    return NextResponse.json({ bookings_by_month: bookingsByMonth, revenue_by_type: revenueByType, top_rooms: topRooms, summary });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
