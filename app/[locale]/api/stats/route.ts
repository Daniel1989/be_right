import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { subDays, startOfWeek, startOfMonth, startOfYear, endOfDay } from 'date-fns';

// Define types
interface StatsOverview {
  totalQuestions: number;
  masteredQuestions: number;
  pendingQuestions: number;
  masteryRate: number;
}

interface ChartData {
  labels: string[];
  collected: number[];
  mastered: number[];
}

interface CalendarDay {
  date: number;
  isEmpty: boolean;
  errorCount: number;
  isToday?: boolean;
}

interface SubjectProgress {
  id: string;
  name: string;
  progress: number;
  color: string;
  icon: string;
  totalQuestions: number;
}

interface RankItem {
  position: number;
  id: string;
  name: string;
  stats: string;
  score: number;
  avatar: string;
  isCurrentUser: boolean;
}

/**
 * GET handler for stats
 * Supports query parameters:
 * - period: 'week' | 'month' | 'year' | 'total' (default: 'week')
 * - type: 'overview' | 'chart' | 'calendar' | 'subjects' | 'rankings' | 'all' (default: 'all')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'week') as 'week' | 'month' | 'year' | 'total';
    const type = (searchParams.get('type') || 'all') as 'overview' | 'chart' | 'calendar' | 'subjects' | 'rankings' | 'all';
    
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
    
    // Determine date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'week':
        startDate = startOfWeek(now);
        break;
      case 'month':
        startDate = startOfMonth(now);
        break;
      case 'year':
        startDate = startOfYear(now);
        break;
      case 'total':
      default:
        startDate = new Date(0); // Beginning of time
        break;
    }
    
    const endDate = endOfDay(now);
    
    // Initialize response data
    const responseData: Record<string, any> = {};
    
    // Get overview statistics
    if (type === 'overview' || type === 'all') {
      responseData.overview = await getOverviewStats(userId, startDate, endDate);
    }
    
    // Get chart data
    if (type === 'chart' || type === 'all') {
      responseData.chart = await getChartData(userId, period);
    }
    
    // Get calendar data
    if (type === 'calendar' || type === 'all') {
      responseData.calendar = await getCalendarData(userId);
    }
    
    // Get subject progress
    if (type === 'subjects' || type === 'all') {
      responseData.subjects = await getSubjectProgress(userId, startDate, endDate);
    }
    
    // Get rankings
    if (type === 'rankings' || type === 'all') {
      responseData.rankings = await getRankings(userId);
    }
    
    // Add learning streak
    if (type === 'all') {
      responseData.streak = await getLearningStreak(userId);
    }
    
    return NextResponse.json({
      success: true,
      period,
      data: responseData
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch statistics' }, { status: 500 });
  }
}

/**
 * Get overview statistics (total questions, mastered, etc.)
 */
async function getOverviewStats(userId: string, startDate: Date, endDate: Date): Promise<StatsOverview> {
  // Get total questions count
  const totalQuestions = await prisma.question.findMany({
    where: {
      userId,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  });
  
  // For demonstration purposes, assuming 70% of questions are mastered
  const masteredQuestions = (totalQuestions || []).filter(q => q.status === 'SOLVED').length;
  
  // Calculate pending questions
  const pendingQuestions = totalQuestions.length - masteredQuestions;
  
  // Calculate mastery rate
  const masteryRate = totalQuestions.length > 0 ? Math.round((masteredQuestions / totalQuestions.length) * 100) : 0;
  
  return {
    totalQuestions: totalQuestions.length,
    masteredQuestions,
    pendingQuestions,
    masteryRate
  };
}

/**
 * Get chart data for line chart
 */
async function getChartData(userId: string, period: string): Promise<ChartData> {
  const days = period === 'week' ? 7 : period === 'month' ? 30 : 12;
  const labels: string[] = [];
  const collected: number[] = [];
  const mastered: number[] = [];
  
  // For week: get data for each day of the week
  if (period === 'week') {
    for (let i = 0; i < 7; i++) {
      const date = subDays(new Date(), 6 - i);
      const dayName = date.toLocaleDateString('zh-CN', { weekday: 'short' });
      labels.push(dayName);
      
      // Get questions created on this day
      const dayCollected = await prisma.question.count({
        where: {
          userId,
          createdAt: {
            gte: new Date(date.setHours(0, 0, 0, 0)),
            lt: new Date(date.setHours(23, 59, 59, 999))
          }
        }
      });
      
      // For demonstration, assume 70% mastered
      const dayMastered = Math.floor(dayCollected * 0.7);
      
      collected.push(dayCollected);
      mastered.push(dayMastered);
    }
  } else {
    // For other periods, generate placeholder data
    // In a real app, this would aggregate by month or year
    const dummyLabels = period === 'month' 
      ? Array.from({ length: 30 }, (_, i) => `${i + 1}日`)
      : ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    
    const dummyData = Array.from({ length: days }, () => Math.floor(Math.random() * 10));
    const dummyMastered = dummyData.map(val => Math.floor(val * 0.7));
    
    return {
      labels: dummyLabels.slice(0, days),
      collected: dummyData,
      mastered: dummyMastered
    };
  }
  
  return { labels, collected, mastered };
}

/**
 * Get calendar data for the heat map
 */
async function getCalendarData(userId: string): Promise<CalendarDay[]> {
  const today = new Date();
  const calendarDays: CalendarDay[] = [];
  
  // Generate data for a 3-week period
  for (let i = 0; i < 21; i++) {
    const date = subDays(today, 20 - i);
    const dayNumber = date.getDate();
    const isCurrentMonth = date.getMonth() === today.getMonth();
    const isToday = date.toDateString() === today.toDateString();
    
    // Count questions added on this day
    const errorCount = await prisma.question.count({
      where: {
        userId,
        createdAt: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999))
        }
      }
    });
    
    calendarDays.push({
      date: dayNumber,
      isEmpty: !isCurrentMonth,
      errorCount,
      isToday
    });
  }
  
  return calendarDays;
}

/**
 * Get subject progress data
 */
async function getSubjectProgress(userId: string, startDate: Date, endDate: Date): Promise<SubjectProgress[]> {
  // Get all subjects
  const subjects = await prisma.subject.findMany({
    where: {
      userId
    }
  });
  
  // Map of icons based on subject names
  const subjectIconMap: Record<string, string> = {
    '数学': 'calculator',
    '物理': 'atom',
    '化学': 'flask',
    '生物': 'dna',
    '历史': 'book',
    '地理': 'globe',
    '英语': 'language',
    '语文': 'book-open'
  };
  
  // Map of colors based on subject names
  const subjectColorMap: Record<string, string> = {
    '数学': '#4F46E5',
    '物理': '#2563EB',
    '化学': '#10B981',
    '生物': '#047857',
    '历史': '#B45309',
    '地理': '#9333EA',
    '英语': '#F59E0B',
    '语文': '#DC2626'
  };
  
  // Format data with separate queries for each subject
  const progressData = await Promise.all(subjects.map(async (subject) => {
    // Count total questions for this subject
    const totalQuestions = await prisma.question.count({
      where: {
        userId,
        subjectId: subject.id,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });
    
    // For demonstration, assume 70% mastered
    const masteredQuestions = await prisma.question.count({
      where: {
        userId,
        subjectId: subject.id,
        status: 'SOLVED',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });
    
    const progress = totalQuestions > 0 ? Math.round((masteredQuestions / totalQuestions) * 100) : 0;
    
    // Get icon and color based on subject name
    let icon = 'book';
    let color = '#4F46E5';
    
    for (const [key, value] of Object.entries(subjectIconMap)) {
      if (subject.name.includes(key)) {
        icon = value;
        break;
      }
    }
    
    for (const [key, value] of Object.entries(subjectColorMap)) {
      if (subject.name.includes(key)) {
        color = value;
        break;
      }
    }
    
    return {
      id: subject.id,
      name: subject.name,
      progress,
      color,
      icon,
      totalQuestions
    };
  }));
  
  return progressData.sort((a, b) => b.totalQuestions - a.totalQuestions);
}

/**
 * Get user rankings
 */
async function getRankings(userId: string): Promise<RankItem[]> {
  // Get users
  const users = await prisma.user.findMany({
    take: 10
  });

  const countPromiseList = users.map(async (user) => {
    const questionCount = await prisma.question.count({
      where: { userId: user.id, status: 'SOLVED' }
    });
    // const questionReviewCount = await prisma.questionReview.count({
    //   where: { questionId: { in: questions.map(q => q.id) }, status: 'REVIEWED' }
    // });
    return { ...user, questionCount: questionCount };
  });
  // Simulate user rankings with random data for demonstration
  const usersWithCounts = await Promise.all(countPromiseList);
  
  // Sort by question count
  usersWithCounts.sort((a, b) => b.questionCount - a.questionCount);
  
  // Find current user's position
  const currentUserIndex = usersWithCounts.findIndex(user => user.id === userId);
  let currentUserRank = currentUserIndex + 1;
  let currentUser = usersWithCounts.find(user => user.id === userId);
  
  // If current user is not in top 10, add them with a random rank
  if (currentUserIndex === -1) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (user) {
      currentUserRank = Math.floor(Math.random() * 100) + 10; // Random rank between 10-110
      currentUser = {
        ...user,
        questionCount: Math.floor(Math.random() * 100) + 20 // Random count between 20-120
      };
    }
  }
  
  // Format rankings
  const rankings: RankItem[] = usersWithCounts.map((user, index) => ({
    position: index + 1,
    id: user.id,
    name: user.name || '用户',
    stats: `已掌握 ${user.questionCount} 个错题`,
    score: user.questionCount * 8, // Simple scoring formula
    avatar: user.avatar || `https://randomuser.me/api/portraits/${index % 2 ? 'women' : 'men'}/${(index * 11) % 99}.jpg`,
    isCurrentUser: user.id === userId
  }));
  
  // If current user is not in top rankings, add them at the end
  if (!rankings.some(r => r.id === userId) && currentUser) {
    rankings.push({
      position: currentUserRank,
      id: currentUser.id,
      name: currentUser.name || '我',
      stats: `已掌握 ${currentUser.questionCount} 个错题`,
      score: currentUser.questionCount * 8,
      avatar: currentUser.avatar || `https://randomuser.me/api/portraits/${currentUserRank % 2 ? 'women' : 'men'}/${(currentUserRank * 7) % 99}.jpg`,
      isCurrentUser: true
    });
  }
  
  return rankings;
}

/**
 * Get user's learning streak
 */
async function getLearningStreak(userId: string): Promise<{ current: number; best: number }> {
  // Get user activity dates in descending order
  const activities = await prisma.question.findMany({
    where: {
      userId
    },
    select: {
      createdAt: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  if (activities.length === 0) {
    return { current: 0, best: 0 };
  }
  
  // Calculate current streak
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Check if user has activity today
  const hasActivityToday = activities.some(a => {
    const activityDate = new Date(a.createdAt);
    activityDate.setHours(0, 0, 0, 0);
    return activityDate.getTime() === today.getTime();
  });
  
  // Group activities by date
  const activityDates = activities.map(a => {
    const date = new Date(a.createdAt);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  });
  
  const uniqueDates = [...new Set(activityDates)].sort((a, b) => b - a);
  
  // Calculate current streak
  let currentStreak = hasActivityToday ? 1 : 0;
  let startDate = hasActivityToday ? yesterday : today;
  
  for (let i = hasActivityToday ? 1 : 0; i < uniqueDates.length; i++) {
    const checkDate = new Date(startDate);
    checkDate.setDate(checkDate.getDate() - i);
    
    const dateTimestamp = checkDate.getTime();
    if (uniqueDates.includes(dateTimestamp)) {
      currentStreak++;
    } else {
      break;
    }
  }
  
  // Calculate best streak (simplified)
  const bestStreak = Math.max(currentStreak, 8); // Placeholder - in a real app would calculate from historical data
  
  return { current: currentStreak, best: bestStreak };
} 