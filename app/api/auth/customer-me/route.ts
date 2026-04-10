import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/auth';
export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  return NextResponse.json({ user: { username: session.username, role: 'CUSTOMER', name: session.name, id: session.id, customer_id: session.customer_id } });
}
