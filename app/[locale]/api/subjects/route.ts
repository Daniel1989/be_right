import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';
import { staticSubjects } from '@/app/lib/constants';


/**
 * Initialize subjects in the database if empty
 */
async function initializeSubjectsIfNeeded(userId: string) {
  try {
    // Check if subjects exist for this user
    const subjectCount = await prisma.subject.count({
      where: { userId }
    });
    
    if (subjectCount === 0) {
      console.log(`No subjects for user ${userId}, initializing with static subjects...`);
      
      // Create all subjects from the static list for this user
      for (const subject of staticSubjects) {
        await prisma.subject.create({
          data: {
            id: subject.id,
            name: subject.name,
            color: subject.color,
            icon: subject.icon,
            userId: userId
          }
        });
      }
      
      console.log('Successfully initialized subjects for user');
    }
  } catch (error) {
    console.error('Error initializing subjects:', error);
  }
}

/**
 * Get subjects for Chinese education system
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user from cookie - we still check auth
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

    // Initialize subjects if needed for this user
    await initializeSubjectsIfNeeded(userData.id);

    // Fetch subjects from the database for this user
    const subjects = await prisma.subject.findMany({
      where: { userId: userData.id },
      orderBy: { name: 'asc' }
    });
    
    // If there are still no subjects after initialization (unlikely but possible)
    // fall back to the static list
    if (subjects.length === 0) {
      return NextResponse.json({
        success: true,
        data: staticSubjects
      });
    }

    // Return the subjects from the database
    return NextResponse.json({
      success: true,
      data: subjects
    });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subjects' },
      { status: 500 }
    );
  }
} 