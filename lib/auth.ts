import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'hotel-secret-key-change-in-production';

export function signToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): any {
  try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getCustomerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('customer_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}
