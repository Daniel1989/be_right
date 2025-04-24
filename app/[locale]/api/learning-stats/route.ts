import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import prisma from '../../../../lib/prisma';

/**
 * GET endpoint to fetch learning statistics for the authenticated user
 * including total questions, mastery status, learning streak, and daily goals
 */
export async function GET(request: NextRequest) {
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
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    // Get total questions count for user
    const totalQuestions = await prisma.question.count({
      where: {
        userId
      }
    });
    
    // Get count of mastered questions (status SOLVED)
    const masteredQuestions = await prisma.question.count({
      where: {
        userId,
        status: 'SOLVED'
      }
    });
    
    // Get count of reviews done today
    const todayCompleted = await prisma.questionReview.count({
      where: {
        userId,
        createdAt: {
          gte: today
        }
      }
    });
    
    // Calculate daily goal based on pending questions
    // (Default goal is 10, but if fewer questions are pending, adjust the goal)
    const pendingQuestionsCount = await prisma.question.count({
      where: {
        userId,
        status: {
          in: ['PENDING', 'REVIEWED']
        }
      }
    });
    
    const defaultGoal = await prisma.userSettings.findUnique({
      where: { userId },
      select: { dailyGoal: true }
    }).then(settings => settings?.dailyGoal || 10);
    const todayGoal = Math.min(defaultGoal, pendingQuestionsCount);
    
    // Calculate learning streak
    // A streak is counted if the user reviewed at least one question each day
    let streak = 0;
    let currentDate = new Date(today);
    currentDate.setDate(currentDate.getDate() - 1); // Start from yesterday
    
    let streakBroken = false;
    const maxDaysToCheck = 30; // Limit how far back we check
    
    for (let i = 0; i < maxDaysToCheck; i++) {
      if (streakBroken) break;
      
      // Set time to start of the day
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      
      // Set time to end of the day
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      // Check if any reviews were done this day
      const reviewsThisDay = await prisma.questionReview.count({
        where: {
          userId,
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      });
      
      if (reviewsThisDay > 0) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1); // Move to previous day
      } else {
        streakBroken = true;
      }
    }
    
    // Check if user has already reviewed today
    const reviewedToday = todayCompleted > 0;
    
    // If user reviewed today, include today in the streak count
    if (reviewedToday) {
      streak++;
    }
    
    // Count unique days the user has studied (total learning days)
    const uniqueDays = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT DATE(createdAt)) as learningDays
      FROM QuestionReview
      WHERE userId = ${userId}
    ` as { learningDays: number }[];
    
    const learningDays = uniqueDays[0]?.learningDays || 0;
    
    return NextResponse.json({
      success: true,
      data: {
        totalQuestions,
        masteredQuestions,
        learningDays,
        streak,
        todayGoal,
        todayCompleted,
        reviewedToday,
        pendingQuestionsCount
      }
    });
    
  } catch (error) {
    console.error('Error fetching learning stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch learning statistics' },
      { status: 500 }
    );
  }
} 