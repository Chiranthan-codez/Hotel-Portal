import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password, name, email, contact, customer_id } = await req.json();

    if (!username?.trim()) return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    if (!password || password.length < 4) return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 400 });
    if (!name?.trim()) return NextResponse.json({ error: 'Full name is required' }, { status: 400 });

    const db = await getDb();

    // Check username not taken
    const [existing] = await db.execute(
      'SELECT id FROM customer_accounts WHERE username = ?', [username.trim()]
    ) as any[];
    if (existing.length > 0) return NextResponse.json({ error: 'Username already taken' }, { status: 409 });

    // If customer_id provided, verify it exists
    let resolvedCustomerId = customer_id || null;
    if (customer_id) {
      const [custs] = await db.execute('SELECT id FROM customers WHERE id = ?', [customer_id]) as any[];
      if (!custs.length) return NextResponse.json({ error: 'Customer record not found' }, { status: 404 });
    }

    const [result] = await db.execute(
      'INSERT INTO customer_accounts (username, password, name, email, contact, customer_id) VALUES (?, ?, ?, ?, ?, ?)',
      [username.trim(), password, name.trim(), email?.trim() || null, contact?.trim() || null, resolvedCustomerId]
    ) as any[];

    const accountId = result.insertId;
    const token = signToken({ id: accountId, username: username.trim(), role: 'CUSTOMER', name: name.trim() });

    const res = NextResponse.json({ success: true, user: { username: username.trim(), role: 'CUSTOMER', name: name.trim() } });
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
