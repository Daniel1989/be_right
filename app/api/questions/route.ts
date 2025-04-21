import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';

/**
 * Get all questions for the current user
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

    // Extract query parameters
    const url = new URL(request.url);
    const subjectId = url.searchParams.get('subjectId');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build query filters
    const filters: any = {
      userId: userData.id
    };

    if (subjectId) {
      filters.subjectId = subjectId;
    }

    // Get total count for pagination
    const total = await prisma.question.count({
      where: filters
    });

    // Get questions with pagination
    const questions = await prisma.question.findMany({
      where: filters,
      include: {
        subject: true,
        images: {
          select: {
            id: true,
            url: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    return NextResponse.json({
      success: true,
      data: questions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

/**
 * Create a new question
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

    const body = await request.json();
    
    const { 
      title, 
      content, 
      wrongAnswer, 
      rightAnswer, 
      subjectId, 
      difficulty = 3,
      imageIds = [] 
    } = body;

    // Validate required fields
    if (!title || !content || !subjectId) {
      return NextResponse.json(
        { success: false, error: 'Title, content, and subject are required' },
        { status: 400 }
      );
    }
    
    // Validate subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId }
    });
    
    if (!subject) {
      return NextResponse.json(
        { success: false, error: 'Invalid subject' },
        { status: 400 }
      );
    }
    
    // Create the question - the text field contains the main content, including the title
    const question = await prisma.question.create({
      data: {
        text: content,  // Schema uses 'text' for main content
        answer: rightAnswer,  // Changed from rightAnswer to answer to match schema
        notes: wrongAnswer,   // Use notes for wrongAnswer
        difficulty: difficulty.toString(),  // Convert to string as per schema
        userId: userData.id,
        subjectId
      }
    });
    
    // If there are associated images, connect them to the question
    if (imageIds.length > 0) {
      await prisma.questionImage.updateMany({
        where: {
          id: {
            in: imageIds
          }
        },
        data: {
          questionId: question.id
        }
      });
    }
    
    // Return the created question with relations
    const createdQuestion = await prisma.question.findUnique({
      where: { id: question.id },
      include: {
        subject: true,
        images: true
      }
    });
    
    return NextResponse.json({
      success: true,
      data: createdQuestion
    });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create question' },
      { status: 500 }
    );
  }
} 