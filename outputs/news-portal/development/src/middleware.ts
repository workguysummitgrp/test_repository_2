import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const protectedRoutes = ['/dashboard', '/admin'];
const authRoutes = ['/auth/login', '/auth/register'];
const adminRoutes = ['/admin', '/api/v1/admin'];
const editorRoutes = ['/dashboard'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request });

  // Rate limiting headers (actual limiting handled by Redis in API routes)
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Policy', 'sliding-window');

  // Redirect authenticated users away from auth pages
  if (authRoutes.some((route) => pathname.startsWith(route)) && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Protect authenticated routes
  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin route RBAC
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (!token || token.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Editor dashboard RBAC
  if (editorRoutes.some((route) => pathname.startsWith(route))) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    const allowedRoles = ['editor', 'reviewer', 'admin'];
    if (!allowedRoles.includes(token.role as string)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // API auth protection
  if (pathname.startsWith('/api/v1/') && !pathname.startsWith('/api/v1/auth/') && !pathname.startsWith('/api/auth/')) {
    const writeMethod = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method);
    if (writeMethod && !token) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
