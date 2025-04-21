import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';
import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';

// JWT config
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';
const JWT_EXPIRES_IN = '7d';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { email, password } = body;
    
    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Verify password
    const passwordMatch = await compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Prepare user data (exclude password)
    const userData = {
      id: user.id,
      name: user.name || '',
      email: user.email
    };
    
    // Generate JWT token
    const token = sign(userData, JWT_SECRET, { 
      expiresIn: JWT_EXPIRES_IN 
    });
    
    // Set authentication cookie with the token
    const cookieStore = await cookies();
    cookieStore.set('auth-token', JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });
    
    // Return success response with token
    return NextResponse.json({
      success: true,
      user: userData,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during login' },
      { status: 500 }
    );
  }
} 