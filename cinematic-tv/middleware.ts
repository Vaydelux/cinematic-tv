import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID().slice(0, 8);
  const response = NextResponse.next();
  response.headers.set('x-request-id', requestId);

  if (process.env.NODE_ENV === 'development' && request.nextUrl.pathname.startsWith('/api/')) {
    const line = `[${new Date().toISOString()}] → ${request.method} ${request.nextUrl.pathname} [${requestId}]`;
    console.log(line);
  }

  return response;
}

export const config = {
  matcher: ['/api/:path*', '/watch/:path*'],
};
