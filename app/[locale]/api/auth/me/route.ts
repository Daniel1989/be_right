import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';

// JWT config
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';

export async function GET() {
  try {
    // Get the auth token from cookies
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token');
    
    if (!authToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Parse the token to get user data
    try {
      const userData = JSON.parse(authToken.value);
      return NextResponse.json({
        success: true,
        user: userData
      });
    } catch (error) {
      // Invalid token format
      cookieStore.delete('auth-token');
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred while fetching user data' },
      { status: 500 }
    );
  }
} 