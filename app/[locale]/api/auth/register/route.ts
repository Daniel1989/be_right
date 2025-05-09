import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';
import { hash } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { z } from 'zod';

// Constants
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';
const JWT_EXPIRES_IN = '7d';

// Validation schema
const UserRegistrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input data
    const result = UserRegistrationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 }
      );
    }
    
    const { name, email, password } = result.data;
    
    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already in use' },
        { status: 400 }
      );
    }
    
    // Hash the password
    const hashedPassword = await hash(password, SALT_ROUNDS);
    
    // Create new user in the database
    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword
      }
    });
    
    // Prepare user data (exclude password)
    const userData = {
      id: newUser.id,
      name: newUser.name || '',
      email: newUser.email
    };
    
    // Generate JWT token
    const token = sign(userData, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });
    
    // Set authentication cookie
    const cookieStore = await cookies();
    cookieStore.set('auth-token', JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });
    
    // Return success response
    return NextResponse.json({
      success: true,
      user: userData,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return NextResponse.json(
        { success: false, error: firstError.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
} 