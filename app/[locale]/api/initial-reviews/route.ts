import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '../../../../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST endpoint to initialize review records for all questions that don't have them
 * This is useful when first setting up the spaced repetition system
 */
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token');
    
    if (!authToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const userData = JSON.parse(authToken.value);
    const userId = userData.id;
    // Find all questions that don't have review records
    const questionsWithoutReviews = await prisma.question.findMany({
      where: {
        userId,
        reviews: {
          none: {}
        }
      },
      select: {
        id: true,
        status: true
      }
    });
    
    console.log(`Found ${questionsWithoutReviews.length} questions without review records`);
    
    if (questionsWithoutReviews.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No questions found that need review initialization' 
      });
    }
    
    // Initialize review records with different due dates based on status
    const reviewRecords = questionsWithoutReviews.map(question => {
      // Set initial nextReviewDate based on question status
      const nextReviewDate = new Date();
      
      if (question.status === 'SOLVED') {
        // For solved questions, set review date far in the future
        nextReviewDate.setDate(nextReviewDate.getDate() + 30);
      } else if (question.status === 'REVIEWED') {
        // For in-progress reviewed questions, set to a few days from now
        nextReviewDate.setDate(nextReviewDate.getDate() + 3);
      } else {
        // For new or pending questions, set to today
        // No adjustment needed
      }
      
      return {
        id: uuidv4(),
        questionId: question.id,
        userId,
        difficulty: 'good', // Default difficulty
        interval: question.status === 'SOLVED' ? 30 : 1, // Default interval based on status
        easeFactor: 2.5, // Default ease factor in Anki
        reviewCount: 0, // No reviews yet
        nextReviewDate
      };
    });
    
    // Create all the review records in a transaction
    const result = await prisma.questionReview.createMany({
      data: reviewRecords,
    });
    
    return NextResponse.json({
      success: true,
      message: `Initialized ${result.count} question reviews successfully`,
      data: {
        totalQuestions: questionsWithoutReviews.length,
        initializedReviews: result.count
      }
    });
    
  } catch (error) {
    console.error('Error initializing reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initialize reviews' },
      { status: 500 }
    );
  }
} 