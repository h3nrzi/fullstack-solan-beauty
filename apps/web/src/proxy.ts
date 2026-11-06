import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Route protection proxy for Next.js App Router.
 * Uses optimistic session checks on incoming requests to protect sensitive dashboard routes.
 */
const protectedPrefixes = ['/dashboard'];
const authRoutes = ['/login'];

export async function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get('salon_session')?.value;
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const isAuthRoute = authRoutes.includes(pathname);

  // 1. Guard protected dashboard routes: redirect unauthenticated users to /login
  if (isProtectedRoute && !sessionToken) {
    const loginUrl = new URL('/login', request.nextUrl);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Redirect authenticated staff away from login to /dashboard
  if (isAuthRoute && sessionToken) {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, sitemap.xml (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};
