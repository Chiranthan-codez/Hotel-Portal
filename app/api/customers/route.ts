import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = await getDb();
    const [rows] = await db.execute(`
      SELECT c.id, c.name, c.contact, c.room_number, c.check_in_date,
             b.status as booking_status, b.check_out_date, b.total_bill, b.id as booking_id, b.payment_status,
             r.room_type,
             ca.username as portal_username, ca.email as portal_email
      FROM customers c
      LEFT JOIN bookings b ON b.customer_id = c.id
      LEFT JOIN rooms r ON c.room_number = r.room_number
      LEFT JOIN customer_accounts ca ON ca.customer_id = c.id
      ORDER BY c.id DESC
    `) as any[];
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
