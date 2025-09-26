import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Let the API routes handle Auth0 logic
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/auth/:path*',
  ],
};
