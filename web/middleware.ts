import { NextResponse, NextRequest } from 'next/server';

export const config = {
  matcher: ['/admin/:path*'],
};

export function middleware(req: NextRequest) {
  const user = process.env.ADMIN_USER || '';
  const pass = process.env.ADMIN_PASS || '';
  if (!user || !pass) {
    // If not configured, deny access hard.
    return new NextResponse('Admin disabled', { status: 403 });
  }

  const auth = req.headers.get('authorization') || '';
  const expected = 'Basic ' + btoa(`${user}:${pass}`);
  const ok = auth === expected;
  if (!ok) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' },
    });
  }
  return NextResponse.next();
}
