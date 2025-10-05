import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Allow access to public routes
  const publicRoutes = ['/login', '/signup', '/'];
  if (publicRoutes.includes(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // For protected routes, check if user has a token in localStorage
  // Since middleware runs on server, we can't access localStorage directly
  // So we'll let the client-side handle the authentication
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
  ],
};
