import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { price_per_day } = await req.json();
    if (!price_per_day || price_per_day <= 0) {
      return NextResponse.json({ error: 'Price must be greater than 0' }, { status: 400 });
    }

    const db = await getDb();
    await db.execute('UPDATE rooms SET price_per_day = ? WHERE room_number = ?', [price_per_day, id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = await getDb();

    const [rooms] = await db.execute(
      'SELECT available FROM rooms WHERE room_number = ?', [id]
    ) as any[];

    if (!rooms.length) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    if (!rooms[0].available) return NextResponse.json({ error: 'Cannot remove occupied room' }, { status: 400 });

    await db.execute('DELETE FROM rooms WHERE room_number = ?', [id]);
    await db.execute('DELETE FROM housekeeping WHERE room_number = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
