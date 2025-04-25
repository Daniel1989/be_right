import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://ark.cn-beijing.volces.com/api/v3",
});

/**
 * GET handler for generating an AI summary of the user's statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth-token');
    
    if (!authCookie?.value) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    let userData;
    try {
      userData = JSON.parse(authCookie.value);
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Invalid auth token' }, { status: 401 });
    }
    
    const userId = userData.id;
    
    // Get user's study data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true }
    });
    
    const totalQuestions = await prisma.question.count({
      where: { userId }
    });
    
    const solvedQuestions = await prisma.question.count({
      where: { 
        userId,
        status: 'SOLVED'
      }
    });
    
    // Get subject distribution
    const subjects = await prisma.subject.findMany({
      where: { userId },
      select: { 
        id: true,
        name: true
      }
    });
    
    const subjectData = await Promise.all(subjects.map(async (subject) => {
      const count = await prisma.question.count({
        where: {
          userId,
          subjectId: subject.id
        }
      });
      
      const solvedCount = await prisma.question.count({
        where: {
          userId,
          subjectId: subject.id,
          status: 'SOLVED'
        }
      });
      
      return {
        name: subject.name,
        count,
        solvedCount,
        masteryRate: count > 0 ? Math.round((solvedCount / count) * 100) : 0
      };
    }));
    
    // Sort subjects by count
    subjectData.sort((a, b) => b.count - a.count);
    
    // Get recent activity (last 14 days)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const recentQuestions = await prisma.question.findMany({
      where: { 
        userId,
        createdAt: { gte: twoWeeksAgo }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        status: true,
        subject: { 
          select: { 
            name: true 
          } 
        }
      }
    });
    
    // Get user's review history
    const reviewHistory = await prisma.questionReview.findMany({
      where: { 
        userId
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        createdAt: true,
        difficulty: true,
        question: {
          select: {
            id: true,
            subject: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });
    
    // Generate AI summary using LLM
    const summary = await generateAISummary({
      userName: user?.name || 'User',
      totalQuestions,
      solvedQuestions,
      subjectData,
      recentQuestions,
      reviewHistory
    });
    
    // Return the summary
    return NextResponse.json({
      success: true,
      data: {
        summary
      }
    });
  } catch (error) {
    console.error('Stats summary API error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate summary' }, { status: 500 });
  }
}

/**
 * Generate an AI-powered personalized study summary using OpenAI
 */
async function generateAISummary(data: {
  userName: string;
  totalQuestions: number;
  solvedQuestions: number;
  subjectData: Array<{ 
    name: string; 
    count: number;
    solvedCount: number;
    masteryRate: number;
  }>;
  recentQuestions: any[];
  reviewHistory: any[];
}): Promise<string> {
  const { userName, totalQuestions, solvedQuestions, subjectData, recentQuestions, reviewHistory } = data;
  
  // Get current time for the greeting
  const hour = new Date().getHours();
  let timeOfDay;
  if (hour < 12) timeOfDay = '早上';
  else if (hour < 18) timeOfDay = '下午';
  else timeOfDay = '晚上';
  
  try {
    // Prepare data for the AI
    const overallMasteryRate = totalQuestions > 0 ? Math.round((solvedQuestions / totalQuestions) * 100) : 0;
    
    // Prepare subject information
    const topSubjects = subjectData.slice(0, 3).map(s => ({
      name: s.name,
      count: s.count,
      masteryRate: s.masteryRate
    }));
    
    // Analyze review patterns
    const recentReviews = reviewHistory.slice(0, 10);
    const successfulReviews = recentReviews.filter(r => r.difficulty <= 3).length;
    const reviewSuccessRate = recentReviews.length > 0 
      ? Math.round((successfulReviews / recentReviews.length) * 100) 
      : 0;
    
    // Extract recent activity subjects
    const recentSubjects = [...new Set(
      recentQuestions
        .map(q => q.subject?.name)
        .filter(Boolean)
    )];
    
    // Create JSON payload for OpenAI
    const userDataJson = JSON.stringify({
      userName,
      timeOfDay,
      stats: {
        totalQuestions,
        solvedQuestions,
        masteryRate: overallMasteryRate
      },
      subjects: topSubjects,
      recentActivity: {
        recentQuestionCount: recentQuestions.length,
        recentSubjects,
        reviewSuccessRate
      }
    });
    
    // If no questions, return a simple message
    if (totalQuestions === 0) {
      return `${timeOfDay}好，${userName}！你还没有添加任何错题。开始记录你的学习过程，我将帮助你跟踪进度并提供个性化的学习建议。`;
    }
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL as string,
      messages: [
        {
          role: "system",
          content: `你是一位专业的学习辅导老师，擅长分析学生的学习数据并提供个性化的学习建议。请基于学生的错题集数据生成一段简洁、鼓励性的学习总结。

主要包括：
1. 根据时间合适的问候
2. 对错题集和学习状况的总结分析
3. 对主要学科的学习建议
4. 个性化的学习激励

语气应当友好、积极、专业，长度控制在200字以内。仅输出中文内容。`
        },
        {
          role: "user",
          content: `请基于以下学生数据，生成一段简洁、鼓励性的学习总结：

${userDataJson}

请只返回纯文本总结，不要包含任何标题、JSON格式或说明文字。`
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    // Extract and return the AI-generated summary
    const aiSummary = response.choices[0]?.message?.content?.trim() || "";
    
    // Fallback to rule-based summary if AI fails or returns empty
    if (!aiSummary) {
      return generateFallbackSummary(data);
    }
    
    return aiSummary;
  } catch (error) {
    console.error('Error generating AI summary:', error);
    // Fall back to rule-based summary on error
    return generateFallbackSummary(data);
  }
}

/**
 * Generate a fallback summary based on rules when AI generation fails
 */
function generateFallbackSummary(data: {
  userName: string;
  totalQuestions: number;
  solvedQuestions: number;
  subjectData: Array<{ 
    name: string; 
    count: number;
    solvedCount: number;
    masteryRate: number;
  }>;
  recentQuestions: any[];
  reviewHistory: any[];
}): string {
  const { userName, totalQuestions, solvedQuestions, subjectData, recentQuestions } = data;
  
  // Calculate stats
  const masteryRate = totalQuestions > 0 ? Math.round((solvedQuestions / totalQuestions) * 100) : 0;
  const topSubjects = subjectData.slice(0, 3);
  const hasRecentActivity = recentQuestions.length > 0;
  const recentSubjects = [...new Set(recentQuestions.map(q => q.subject?.name).filter(Boolean))];
  
  // Generate personalized insights
  const insights = [];
  
  // Overall progress
  if (totalQuestions === 0) {
    insights.push(`你还没有添加任何错题，开始记录你的学习吧！`);
  } else {
    if (masteryRate >= 80) {
      insights.push(`你已经掌握了${masteryRate}%的错题，继续保持！`);
    } else if (masteryRate >= 50) {
      insights.push(`你已经掌握了${masteryRate}%的错题，还有提升空间。`);
    } else {
      insights.push(`你的掌握率为${masteryRate}%，加油复习吧！`);
    }
  }
  
  // Subject distribution
  if (topSubjects.length > 0) {
    const topSubjectsList = topSubjects
      .map(s => `${s.name}(${s.count}题)`)
      .join('、');
    
    insights.push(`你的错题主要集中在${topSubjectsList}。`);
    
    // Focus suggestion
    const focusSubject = topSubjects[0];
    if (focusSubject && focusSubject.count > 5) {
      insights.push(`建议重点关注${focusSubject.name}的练习。`);
    }
  }
  
  // Recent activity
  if (hasRecentActivity) {
    const recentSubjectsList = recentSubjects.join('、');
    if (recentSubjectsList) {
      insights.push(`最近你主要练习了${recentSubjectsList}。`);
    }
    
    // Recent performance
    const recentSolved = recentQuestions.filter(q => q.status === 'SOLVED').length;
    if (recentQuestions.length > 0) {
      const recentRate = Math.round((recentSolved / recentQuestions.length) * 100);
      insights.push(`最近的掌握率为${recentRate}%。`);
    }
  }
  
  // Create time-appropriate greeting
  const hour = new Date().getHours();
  let greeting;
  if (hour < 12) {
    greeting = '早上好';
  } else if (hour < 18) {
    greeting = '下午好';
  } else {
    greeting = '晚上好';
  }
  
  // Compile final summary
  let summary = `${greeting}，${userName}！`;
  
  if (insights.length > 0) {
    summary += ' ' + insights.join(' ');
  }
  
  // Add encouragement
  const encouragements = [
    '坚持就是胜利，继续学习吧！',
    '每天进步一点点，终将与众不同。',
    '学习是一场持久战，加油！',
    '今天的付出，就是明天的收获。'
  ];
  
  const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
  summary += ` ${randomEncouragement}`;
  
  return summary;
} 