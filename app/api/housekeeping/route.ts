import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await getDb();

    // Ensure all rooms have a housekeeping row
    await db.execute(`
      INSERT IGNORE INTO housekeeping (room_number, status)
      SELECT room_number, 'CLEAN' FROM rooms
    `);

    const [rows] = await db.execute(`
      SELECT h.room_number, h.status, h.notes, h.updated_at,
             r.room_type, r.price_per_day, r.available
      FROM housekeeping h
      JOIN rooms r ON h.room_number = r.room_number
      ORDER BY h.room_number
    `) as any[];

    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { room_number, status, notes } = await req.json();
    const db = await getDb();

    await db.execute(
      'INSERT INTO housekeeping (room_number, status, notes) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status = ?, notes = ?',
      [room_number, status, notes || '', status, notes || '']
    );

    // Sync room availability based on cleaning status
    if (status === 'CLEAN') {
      // Only mark available if there's no active booking on this room
      const [activeBookings] = await db.execute(
        'SELECT id FROM bookings WHERE room_number = ? AND status = ?',
        [room_number, 'ACTIVE']
      ) as any[];
      if (activeBookings.length === 0) {
        await db.execute('UPDATE rooms SET available = TRUE WHERE room_number = ?', [room_number]);
      }
    } else {
      // NEEDS_CLEANING or IN_PROGRESS — room is not available for booking
      await db.execute('UPDATE rooms SET available = FALSE WHERE room_number = ?', [room_number]);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
