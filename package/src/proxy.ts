import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const session = request.cookies.get('buildos-token');

  // Protect the dashboard and root routes
  const isProtectedRoute = request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname === '/admin';
  const isAuthRoute = request.nextUrl.pathname.startsWith('/authentication/');

  if (isProtectedRoute && !session) {
    // If trying to access protected route without a session, redirect to login
    return NextResponse.redirect(new URL('/authentication/login', request.url));
  }

  if (isAuthRoute && session) {
    // If trying to access login/register while already logged in, redirect to dashboard
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Apply middleware to all routes except API, static files, and images
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
