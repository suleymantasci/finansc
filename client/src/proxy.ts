import { NextResponse, type NextRequest } from 'next/server';
import { PROTECTED_ROUTES, AUTH_ROUTES, ADMIN_ROUTES } from '@/lib/constants';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if user has auth token in cookies (set by client-side auth flow)
  const token = request.cookies.get('finanscozum-token')?.value;
  const userRole = request.cookies.get('finanscozum-role')?.value;

  const isProtectedRoute = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname === r);

  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/giris', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to home if accessing admin route without admin role
  if (isAdminRoute && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirect to home if accessing auth routes while logged in
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/hesabim/:path*',
    '/admin/:path*',
    '/giris',
    '/kayit',
    '/sifremi-unuttum',
  ],
};
