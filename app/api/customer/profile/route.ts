import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCustomerSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getCustomerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = await getDb();
    const [rows] = await db.execute(
      'SELECT id, username, name, email, contact, customer_id, created_at FROM customer_accounts WHERE id = ?',
      [session.id]
    ) as any[];
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getCustomerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { name, email, contact } = await req.json();
    const db = await getDb();
    await db.execute(
      'UPDATE customer_accounts SET name = ?, email = ?, contact = ? WHERE id = ?',
      [name, email, contact, session.id]
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
