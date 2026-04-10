import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await getDb();
    const [rows] = await db.execute(`
      SELECT r.*, COALESCE(h.status, 'CLEAN') as cleaning_status
      FROM rooms r
      LEFT JOIN housekeeping h ON r.room_number = h.room_number
      ORDER BY r.room_number
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

    const { room_number, room_type, price_per_day } = await req.json();
    if (!room_number || !room_type || !price_per_day) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    if (price_per_day <= 0) {
      return NextResponse.json({ error: 'Price must be greater than 0' }, { status: 400 });
    }

    const db = await getDb();
    const [existing] = await db.execute(
      'SELECT room_number FROM rooms WHERE room_number = ?',
      [room_number.trim().toUpperCase()]
    ) as any[];

    if (existing.length > 0) {
      return NextResponse.json({ error: `Room '${room_number}' already exists` }, { status: 409 });
    }

    await db.execute(
      'INSERT INTO rooms (room_number, room_type, price_per_day, available) VALUES (?, ?, ?, TRUE)',
      [room_number.trim().toUpperCase(), room_type, price_per_day]
    );

    // Also add to housekeeping
    await db.execute(
      'INSERT IGNORE INTO housekeeping (room_number, status) VALUES (?, ?)',
      [room_number.trim().toUpperCase(), 'CLEAN']
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
