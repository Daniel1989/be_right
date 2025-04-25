import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { DEFALULT_DAILY_GOAL } from '@/app/lib/constants';

/**
 * GET endpoint to fetch user learning settings
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user from cookie
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token');
    
    if (!authToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const userData = JSON.parse(authToken.value);
    
    if (!userData || !userData.id) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication' },
        { status: 401 }
      );
    }
    
    const userId = userData.id;
    
    // Get user settings from database
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId }
    });
    
    // If no settings exist yet, return default values
    if (!userSettings) {
      return NextResponse.json({
        success: true,
        data: {
          dailyGoal: DEFALULT_DAILY_GOAL
        }
      });
    }
    
    // Return the user settings
    return NextResponse.json({
      success: true,
      data: {
        dailyGoal: userSettings.dailyGoal
      }
    });
    
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user settings' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to update user learning settings
 */
export async function POST(request: NextRequest) {
  try {
    // Get current user from cookie
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token');
    
    if (!authToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const userData = JSON.parse(authToken.value);
    
    if (!userData || !userData.id) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication' },
        { status: 401 }
      );
    }
    
    const userId = userData.id;
    
    // Parse request body
    const body = await request.json();
    const { dailyGoal } = body;
    
    // Validate input
    if (typeof dailyGoal !== 'number' || dailyGoal < 1 || dailyGoal > 50) {
      return NextResponse.json(
        { success: false, error: 'Daily goal must be a number between 1 and 50' },
        { status: 400 }
      );
    }
    
    // Update or create user settings using upsert
    const updatedSettings = await prisma.userSettings.upsert({
      where: { userId },
      update: { dailyGoal },
      create: {
        userId,
        dailyGoal
      }
    });
    
    // Return the updated settings
    return NextResponse.json({
      success: true,
      data: {
        dailyGoal: updatedSettings.dailyGoal
      }
    });
    
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user settings' },
      { status: 500 }
    );
  }
} 