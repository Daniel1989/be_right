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

// Middleware function
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
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
    const loginUrl = new URL(`/${locale}/auth/login`, request.url);
    
    // Add the original URL as a parameter to redirect after login
    loginUrl.searchParams.set('callbackUrl', encodeURIComponent(request.url));
    
    return NextResponse.redirect(loginUrl);
  }
  
  // User is authenticated, proceed with intl middleware
  return intlMiddleware(request);
}

export const config = {
  // Match all paths except for 
  // - API routes
  // - Static files
  // - _next internal paths
  matcher: ['/((?!api|_next|.*\\..*).*)']
}; 