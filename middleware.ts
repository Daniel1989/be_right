import { NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';

// Define all supported locales
export const locales = ['en', 'zh'];
// Set the default locale
export const defaultLocale = 'en';

// Create the internationalization middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localeDetection: true,
  pathnames: {
    '/': '/',
    '/about': '/about'
  }
});

// Define paths that don't require authentication
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/',
  '/about',
  '/contact',
  '/terms',
  '/privacy',
];

// Check if path is public (doesn't require authentication)
function isPublicPath(path: string, locale: string): boolean {
  return PUBLIC_PATHS.some(publicPath => {
    // console.log('publicPath', publicPath, path, `/${locale}${path}`);
    return path === publicPath || 
     path === `/${locale}${publicPath}` || 
    path.startsWith(`/${locale}/api/auth/`) || 
    path.startsWith('/_next/') || 
    path.startsWith('/static/') ||
    path.startsWith('/uploads/') ||
    path.startsWith('/favicon') ||
    path.includes('.') // Skip file requests
  }
  );
}

/**
 * Get the correct base URL considering proxy servers (e.g., Nginx)
 * This uses X-Forwarded-Host header if present
 */
function getBaseUrl(request: NextRequest): string {
  // Get host from X-Forwarded-Host header or fallback to request.headers
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost';
  
  // Get protocol from X-Forwarded-Proto header or fallback to https
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  
  return `${protocol}://${host}`;
}

// Middleware function
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locale = pathname.split('/')[1] || defaultLocale;
  // Skip middleware for public paths
  if (isPublicPath(pathname, locale)) {
    return intlMiddleware(request);
  }
  // Get auth token from cookie
  const authToken = request.cookies.get('auth-token')?.value;
  
  // If no token and accessing protected route, redirect to login
  if (!authToken) {
    
    // If API request, return 401 Unauthorized
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // For non-API requests, redirect to login
    const baseUrl = getBaseUrl(request);
    const loginUrl = new URL(`/${locale}/auth/login`, baseUrl);
    
    // Add the current path as a callbackUrl parameter
    const currentPath = pathname + request.nextUrl.search;
    loginUrl.searchParams.set('callbackUrl', encodeURIComponent(currentPath));
    
    return NextResponse.redirect(loginUrl);
  }
  
  // Continue to protected route if token exists
  return intlMiddleware(request);
}

export const config = {
  // Match all paths except for 
  // - Static files (_next, favicon, images, etc)
  // - Internal Next.js paths
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (image files)
     * - public/ (public assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|images|public).*)'
  ]
}; 