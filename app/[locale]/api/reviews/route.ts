import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { record } from 'zod';

// Define review difficulty levels
type ReviewDifficulty = 'again' | 'hard' | 'good' | 'easy';

/**
 * GET endpoint to fetch questions that are due for review based on the Anki algorithm
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
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const subjectId = searchParams.get('subjectId');
    const limit = limitParam ? parseInt(limitParam) : 10;
    
    // For development: include questions with review dates up to one day in the future
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Build the filter
    const filter: any = {
      userId,
    };
    
    // Add subject filter if provided
    if (subjectId) {
      filter.questionId = {
        in: await prisma.question.findMany({
          where: {
            userId,
            subjectId,
          },
          select: {
            id: true
          }
        }).then(questions => questions.map(q => q.id))
      };
    }
    
    // First, get all question IDs that are due for review
    const reviewRecords = await prisma.questionReview.findMany({
      where: filter,
      select: {
        questionId: true,
        createdAt: true,
        nextReviewDate: true
      },
      orderBy: {
        createdAt: 'desc', // Use latest created item
      },
      // take: limit,
      distinct: ['questionId'], // Remove duplicate questionId
    });
    const questionIds = reviewRecords.filter(record=>record.nextReviewDate <= tomorrow).map(record => record.questionId);

    // Then fetch the actual questions with their review data
    const questions = await prisma.question.findMany({
      where: {
        id: {
          in: questionIds.slice(0, limit)
        }
      },
      include: {
        subject: true,
        images: true,
        reviews: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });
    
    // Format the response to include Anki-related fields
    const formattedQuestions = questions.map(question => {
      const reviewData = question.reviews[0];
      return {
        id: question.id,
        text: question.text,
        answer: question.answer,
        notes: question.notes,
        difficulty: question.difficulty,
        status: question.status,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
        subject: question.subject,
        images: question.images,
        // Anki-specific properties
        nextReviewDate: reviewData?.nextReviewDate,
        interval: reviewData?.interval,
        easeFactor: reviewData?.easeFactor,
        reviewCount: reviewData?.reviewCount,
      };
    });
    
    // Get total count of due questions for pagination
    const totalDueQuestions = await prisma.questionReview.count({
      where: {
        ...filter,
        nextReviewDate: {
          lte: tomorrow
        }
      },
    });
    
    return NextResponse.json({
      success: true,
      data: formattedQuestions,
      pagination: {
        total: totalDueQuestions,
        limit,
        remaining: Math.max(0, totalDueQuestions - limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching due questions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch due questions' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to record a review result and update the next review date
 * based on the SM-2 spaced repetition algorithm
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
    const requestData = await request.json();
    
    const { questionId, difficulty } = requestData;
    
    if (!questionId || !difficulty) {
      return NextResponse.json(
        { success: false, error: 'questionId and difficulty are required' },
        { status: 400 }
      );
    }
    
    // Validate the question belongs to the user
    const question = await prisma.question.findFirst({
      where: {
        id: questionId,
        userId
      }
    });
    
    if (!question) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }
    
    // Get the most recent review record for this question
    const previousReview = await prisma.questionReview.findFirst({
      where: {
        questionId,
        userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Apply the SM-2 algorithm to calculate the new interval and ease factor
    let interval = previousReview?.interval || 1; // Default to 1 day if no previous review
    let easeFactor = previousReview?.easeFactor || 2.5; // Default ease factor
    let reviewCount = (previousReview?.reviewCount || 0) + 1;
    
    // SM-2 algorithm implementation
    switch (difficulty as ReviewDifficulty) {
      case 'again': // Failed completely
        interval = 1;
        easeFactor = Math.max(1.3, easeFactor - 0.2);
        break;
      case 'hard': // Significant difficulty
        interval = Math.ceil(interval * 1.2);
        easeFactor = Math.max(1.3, easeFactor - 0.15);
        break;
      case 'good': // Some difficulty but recalled
        interval = Math.ceil(interval * easeFactor);
        break;
      case 'easy': // Perfect recall
        interval = Math.ceil(interval * easeFactor * 1.3);
        easeFactor = easeFactor + 0.15;
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid difficulty value' },
          { status: 400 }
        );
    }
    
    // Cap the interval at 365 days (1 year)
    interval = Math.min(interval, 365);
    
    // Calculate the next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);
    
    // Create a new review record
    const newReview = await prisma.questionReview.create({
      data: {
        id: uuidv4(),
        questionId,
        userId,
        difficulty: difficulty as string,
        interval,
        easeFactor,
        reviewCount,
        nextReviewDate
      }
    });
    
    // Update the question status based on the review
    let newStatus = question.status;
    if (difficulty === 'easy' && interval > 21) {
      // If the interval is > 21 days and the user rated it as easy,
      // consider it "mastered"
      newStatus = 'SOLVED';
    } else if (difficulty === 'again') {
      // If the user completely failed, set back to pending
      newStatus = 'PENDING';
    } else {
      // Otherwise it's being reviewed
      newStatus = 'REVIEWED';
    }
    
    // Update the question status
    await prisma.question.update({
      where: {
        id: questionId
      },
      data: {
        status: newStatus,
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        reviewId: newReview.id,
        questionId,
        interval,
        easeFactor,
        reviewCount,
        nextReviewDate,
        status: newStatus
      }
    });
    
  } catch (error) {
    console.error('Error recording review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record review' },
      { status: 500 }
    );
  }
} 