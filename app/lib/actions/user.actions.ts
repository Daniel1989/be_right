'use server';

import { prisma } from '../prisma';
import { z } from 'zod';
import { hash, compare } from 'bcrypt';
import { cookies } from 'next/headers';
import { sign, verify } from 'jsonwebtoken';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

// Env vars for JWT (normally these would be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';
const JWT_EXPIRES_IN = '7d';
const SALT_ROUNDS = 10; // For bcrypt password hashing

const UserRegistrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const UserLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type UserRegistrationData = z.infer<typeof UserRegistrationSchema>;
export type UserLoginData = z.infer<typeof UserLoginSchema>;

// Types
type LoginParams = {
  email: string;
  password: string;
};

type RegisterParams = {
  name: string;
  email: string;
  password: string;
};

type AuthResponse = {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
};

// Default locale in case it's not found in the URL
const DEFAULT_LOCALE = 'en';

/**
 * Login a user with email and password
 */
export async function loginUser({ 
  email, 
  password 
}: LoginParams): Promise<AuthResponse> {
  try {
    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (!user) {
      return {
        success: false,
        error: 'Invalid email or password'
      };
    }

    // Compare password hash
    const passwordMatch = await compare(password, user.password);
    
    if (!passwordMatch) {
      return {
        success: false,
        error: 'Invalid email or password'
      };
    }

    // Prepare user data for token (exclude password)
    const userData = {
      id: user.id,
      name: user.name || '',
      email: user.email
    };

    // Set authentication cookie
    const cookieStore = await cookies();
    cookieStore.set('auth-token', JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    // Get locale from headers for path revalidation
    const headersList = await headers();
    const referer = headersList.get('referer') || '/';
    const { pathname } = new URL(referer);
    const locale = pathname.split('/')[1] || DEFAULT_LOCALE;

    // Revalidate user data with locale
    revalidatePath(`/${locale}/dashboard`);
    
    return {
      success: true,
      user: userData
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'An error occurred during login'
    };
  }
}

/**
 * Register a new user
 */
export async function registerUser({ 
  name, 
  email, 
  password 
}: RegisterParams): Promise<AuthResponse> {
  try {
    // Validate input
    const validatedData = UserRegistrationSchema.parse({
      name,
      email,
      password
    });
    
    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() }
    });
    
    if (existingUser) {
      return {
        success: false,
        error: 'Email already in use'
      };
    }

    // Hash the password
    const hashedPassword = await hash(validatedData.password, SALT_ROUNDS);

    // Create new user in the database
    const newUser = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email.toLowerCase(),
        password: hashedPassword
      }
    });
    
    // Prepare user data for token (exclude password)
    const userData = {
      id: newUser.id,
      name: newUser.name || '',
      email: newUser.email
    };

    // Set authentication cookie
    const cookieStore = await cookies();
    cookieStore.set('auth-token', JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    // Get locale from headers for path revalidation
    const headersList = await headers();
    const referer = headersList.get('referer') || '/';
    const { pathname } = new URL(referer);
    const locale = pathname.split('/')[1] || DEFAULT_LOCALE;

    // Revalidate user data with locale
    revalidatePath(`/${locale}/dashboard`);
    
    return {
      success: true,
      user: userData
    };
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        error: firstError.message
      };
    }
    
    return {
      success: false,
      error: 'An error occurred during registration'
    };
  }
}

/**
 * Log out the current user
 */
export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
  
  // Redirect to login page with locale support
  const headersList = await headers();
  const referer = headersList.get('referer') || '/';
  const { pathname } = new URL(referer);
  const locale = pathname.split('/')[1] || DEFAULT_LOCALE;
  
  redirect(`/${locale}/auth/login`);
}

/**
 * Get the current user from cookies
 */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth-token');
  
  if (!authToken) {
    return null;
  }
  
  try {
    return JSON.parse(authToken.value);
  } catch (error) {
    return null;
  }
} 