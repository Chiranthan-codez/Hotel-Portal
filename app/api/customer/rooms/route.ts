import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCustomerSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getCustomerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = await getDb();
    const [rows] = await db.execute(`
      SELECT r.*, COALESCE(h.status, 'CLEAN') as cleaning_status
      FROM rooms r
      LEFT JOIN housekeeping h ON r.room_number = h.room_number
      ORDER BY r.room_type, r.room_number
    `) as any[];
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
