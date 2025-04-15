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

// Define public routes that don't require authentication
const publicRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
];

// API routes that should be accessible without authentication
const publicApiRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
];

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
  const pathname = request.nextUrl.pathname;
  
  // Skip middleware for public API routes
  if (publicApiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Handle /api/auth/me and /api/auth/logout routes
  if (pathname === '/api/auth/me' || pathname === '/api/auth/logout') {
    // These routes require authentication but shouldn't redirect to login
    const authToken = request.cookies.get('auth-token');
    if (!authToken && pathname === '/api/auth/me') {
      // For /api/auth/me, just return a 401 response if not authenticated
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }
  
  // Public paths are accessible without authentication
  if (publicRoutes.some(route => 
    pathname.includes(route) || pathname === '/' || pathname === '/about'
  )) {
    return intlMiddleware(request);
  }
  
  // Check if user has auth token
  const authToken = request.cookies.get('auth-token');
  
  // If no auth token, redirect to login page
  if (!authToken) {
    // Extract locale from URL
    const locale = pathname.split('/')[1] || defaultLocale;
    
    // Get base URL considering proxy configuration
    const baseUrl = getBaseUrl(request);
    const loginUrl = new URL(`/${locale}/auth/login`, baseUrl);
    
    // Add the current path as a callbackUrl parameter to redirect after login
    // Use the proper base URL for the callback URL as well
    const currentPath = pathname + request.nextUrl.search;
    const fullCurrentUrl = `${baseUrl}${currentPath}`;
    
    loginUrl.searchParams.set('callbackUrl', encodeURIComponent(fullCurrentUrl));
    
    return NextResponse.redirect(loginUrl);
  }
  
  // User is authenticated, proceed with intl middleware
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