import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) return NextResponse.json({ error: 'Username and password required' }, { status: 400 });

    const db = await getDb();
    const [rows] = await db.execute(
      'SELECT id, username, name, customer_id FROM customer_accounts WHERE username = ? AND password = ?',
      [username.trim(), password.trim()]
    ) as any[];

    if (!rows.length) return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });

    const acc = rows[0];
    const token = signToken({ id: acc.id, username: acc.username, role: 'CUSTOMER', name: acc.name, customer_id: acc.customer_id });

    const res = NextResponse.json({ success: true, user: { username: acc.username, role: 'CUSTOMER', name: acc.name } });
    res.cookies.set('customer_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
