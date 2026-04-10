import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    const db = await getDb();
    const [rows] = await db.execute(
      'SELECT userid, username, role FROM users WHERE username = ? AND password = ?',
      [username.trim(), password.trim()]
    ) as any[];

    if (!rows.length) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const user = rows[0];
    const token = signToken({ id: user.userid, username: user.username, role: user.role });

    const res = NextResponse.json({ success: true, user: { username: user.username, role: user.role } });
    res.cookies.set('auth_token', token, {
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
