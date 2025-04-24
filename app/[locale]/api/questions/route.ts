import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

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
    const status = url.searchParams.get('status');
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
    
    if (status) {
      filters.status = status;
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
 * Create a new question or multiple questions in batch
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
    
    // Check if it's a batch operation (array of questions)
    const isBatchOperation = Array.isArray(body);
    
    if (isBatchOperation) {
      return await handleBatchQuestions(body, userData.id);
    } else {
      return await handleSingleQuestion(body, userData.id);
    }
  } catch (error) {
    console.error('Error creating question(s):', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create question(s)' },
      { status: 500 }
    );
  }
}

/**
 * Handle creating a single question
 */
async function handleSingleQuestion(data: any, userId: string) {
  const { 
    content, 
    wrongAnswer, 
    rightAnswer, 
    subjectId, 
    difficulty = 3,
    imageIds = [] 
  } = data;

  // Validate required fields
  if (!content || !subjectId) {
    return NextResponse.json(
      { success: false, error: 'Content and subject are required' },
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
  
  // Create the question
  const question = await prisma.question.create({
    data: {
      text: content,
      answer: rightAnswer || '',
      notes: wrongAnswer || '',
      difficulty: difficulty.toString(),
      userId: userId,
      subjectId
    }
  });
  
  // If there are associated images, connect them to the question
  if (imageIds.length > 0) {
    await prisma.questionImage.updateMany({
      where: {
        id: {
          in: imageIds
        },
        userId: userId // Only update images owned by this user
      },
      data: {
        questionId: question.id
      }
    });
  }
  
  // Create initial review record for the question
  const initialInterval = 1; // Start with 1 day interval
  const initialEaseFactor = 2.5; // Default ease factor
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + initialInterval); // Set to tomorrow
  
  await prisma.questionReview.create({
    data: {
      id: uuidv4(), // Generate a UUID
      questionId: question.id,
      userId: userId,
      difficulty: 'new', // Initial difficulty
      interval: initialInterval,
      easeFactor: initialEaseFactor,
      reviewCount: 0,
      nextReviewDate: nextReviewDate
    }
  });
  
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
}

/**
 * Handle creating multiple questions in a batch
 */
async function handleBatchQuestions(questionsData: any[], userId: string) {
  const results = {
    success: true,
    data: {
      total: questionsData.length,
      successful: 0,
      failed: 0,
      createdQuestions: [] as any[]
    }
  };
  
  // Check if any questions were provided
  if (questionsData.length === 0) {
    return NextResponse.json({
      success: false, 
      error: 'No questions provided for batch creation'
    }, { status: 400 });
  }
  
  // Process each question in the batch
  for (const questionData of questionsData) {
    try {
      const { 
        content, 
        wrongAnswer, 
        rightAnswer, 
        subjectId, 
        difficulty = 3,
        imageIds = [] 
      } = questionData;
      
      // Skip questions with missing required fields
      if (!content || !subjectId) {
        results.data.failed++;
        continue;
      }
      
      // Validate subject exists
      const subject = await prisma.subject.findUnique({
        where: { id: subjectId }
      });
      
      if (!subject) {
        results.data.failed++;
        continue;
      }
      
      // Create the question
      const question = await prisma.question.create({
        data: {
          text: content,
          answer: rightAnswer || '',
          notes: wrongAnswer || '',
          difficulty: difficulty.toString(),
          userId: userId,
          subjectId
        }
      });
      
      // If there are associated images, connect them to the question
      if (imageIds.length > 0) {
        await prisma.questionImage.updateMany({
          where: {
            id: {
              in: imageIds
            },
            userId: userId
          },
          data: {
            questionId: question.id
          }
        });
      }
      
      // Create initial review record for the question
      const initialInterval = 1; // Start with 1 day interval
      const initialEaseFactor = 2.5; // Default ease factor
      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + initialInterval); // Set to tomorrow
      
      await prisma.questionReview.create({
        data: {
          id: uuidv4(), // Generate a UUID
          questionId: question.id,
          userId: userId,
          difficulty: 'new', // Initial difficulty
          interval: initialInterval,
          easeFactor: initialEaseFactor,
          reviewCount: 0,
          nextReviewDate: nextReviewDate
        }
      });
      
      // Get the created question with relations
      const createdQuestion = await prisma.question.findUnique({
        where: { id: question.id },
        include: {
          subject: true,
          images: true
        }
      });
      
      if (createdQuestion) {
        results.data.successful++;
        results.data.createdQuestions.push(createdQuestion);
      } else {
        results.data.failed++;
      }
    } catch (error) {
      console.error('Error creating question in batch:', error);
      results.data.failed++;
    }
  }
  
  // If all questions failed, return an error
  if (results.data.successful === 0) {
    return NextResponse.json({
      success: false,
      error: 'Failed to create any questions in the batch'
    }, { status: 500 });
  }
  
  return NextResponse.json(results);
}

/**
 * Delete a question
 */
export async function DELETE(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { questionId } = body;
    
    if (!questionId) {
      return NextResponse.json(
        { success: false, error: 'Question ID is required' },
        { status: 400 }
      );
    }
    
    // Verify the question exists and belongs to the user
    const question = await prisma.question.findFirst({
      where: {
        id: questionId,
        userId: userData.id
      }
    });
    
    if (!question) {
      return NextResponse.json(
        { success: false, error: 'Question not found or you do not have permission' },
        { status: 404 }
      );
    }
    
    // Delete the question
    await prisma.question.delete({
      where: {
        id: questionId
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete question' },
      { status: 500 }
    );
  }
} 