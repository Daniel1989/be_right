'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';

// Define types for our data
type Subject = {
  id: string;
  name: string;
  color: string;
  icon: string;
};

type QuestionImage = {
  id: string;
  url: string;
};

type Question = {
  id: string;
  text: string;
  answer: string;
  notes: string;
  difficulty: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  subject: Subject;
  images: QuestionImage[];
  
  // Anki-specific properties
  nextReviewDate?: string;
  interval?: number;
  easeFactor?: number;
  reviewCount?: number;
};

type Pagination = {
  total: number;
  limit: number;
  remaining: number;
};

type LearningStats = {
  totalQuestions: number;
  masteredQuestions: number;
  learningDays: number;
  todayGoal: number;
  todayCompleted: number;
  streak: number;
  reviewedToday: boolean;
  pendingQuestionsCount: number;
};

export default function DashboardPage() {
  const t = useTranslations('navigation');
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.split('/')[1] || 'en';

  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<LearningStats>({
    totalQuestions: 0,
    masteredQuestions: 0,
    learningDays: 0,
    todayGoal: 10,
    todayCompleted: 0,
    streak: 0,
    reviewedToday: false,
    pendingQuestionsCount: 0
  });
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    limit: 10,
    remaining: 0
  });
  const [currentReviewQuestion, setCurrentReviewQuestion] = useState<Question | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [masteredQuestions, setMasteredQuestions] = useState<Question[]>([]);

  useEffect(() => {
    fetchSubjects();
    fetchLearningStats();
    fetchDueQuestions();
    fetchMasteredQuestions();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await fetch(`/${locale}/api/subjects`);
      if (!response.ok) {
        throw new Error('Failed to fetch subjects');
      }
      
      const data = await response.json();
      if (data.success) {
        setSubjects(data.data);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError('Failed to load subjects');
    }
  };

  const fetchLearningStats = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/${locale}/api/learning-stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch learning statistics');
      }
      
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching learning stats:', err);
      setError('Failed to load learning statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDueQuestions = async () => {
    try {
      setIsLoading(true);
      
      // Build the API URL with query parameters
      let url = `/${locale}/api/reviews?limit=10`;
      if (selectedSubjectId) {
        url += `&subjectId=${selectedSubjectId}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch due questions');
      }
      
      const data = await response.json();
      if (data.success) {
        setQuestions(data.data);
        setPagination(data.pagination);
      } else {
        // If no questions are due, set empty array
        setQuestions([]);
        setPagination({
          total: 0,
          limit: 10,
          remaining: 0
        });
      }
    } catch (err) {
      console.error('Error fetching due questions:', err);
      setError('Failed to load due questions');
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMasteredQuestions = async () => {
    try {
      const response = await fetch(`/${locale}/api/questions?status=SOLVED&limit=5`);
      if (!response.ok) {
        throw new Error('Failed to fetch mastered questions');
      }
      
      const data = await response.json();
      if (data.success) {
        setMasteredQuestions(data.data);
      }
    } catch (err) {
      console.error('Error fetching mastered questions:', err);
    }
  };

  const handleSubjectFilter = (subjectId: string | null) => {
    setSelectedSubjectId(subjectId);
    // Refetch questions with the selected subject filter
    fetchDueQuestions();
  };

  const startReview = () => {
    if (questions.length > 0) {
      setCurrentReviewQuestion(questions[0]);
      setShowAnswer(false);
      setReviewMode(true);
    }
  };

  const revealAnswer = () => {
    setShowAnswer(true);
  };

  const rateAnswer = async (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentReviewQuestion) return;
    
    try {
      setIsSubmitting(true);
      
      // Send the review to the API
      const response = await fetch(`/${locale}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: currentReviewQuestion.id,
          difficulty: rating
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit review');
      }
      
      // Update stats
      fetchLearningStats();
      
      // Move to the next question
      const updatedQuestions = questions.filter(q => q.id !== currentReviewQuestion.id);
      
      // Get the next question if available
      if (updatedQuestions.length > 0) {
        setQuestions(updatedQuestions);
        setCurrentReviewQuestion(updatedQuestions[0]);
        setShowAnswer(false);
      } else {
        // End of review session
        setQuestions([]);
        setCurrentReviewQuestion(null);
        setReviewMode(false);
        
        // Show completion message
        if (stats.todayCompleted >= stats.todayGoal) {
          alert('恭喜！你已完成今日学习目标！');
        }
        
        // Refresh the mastered questions
        fetchMasteredQuestions();
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const exitReview = () => {
    setReviewMode(false);
    setCurrentReviewQuestion(null);
    setShowAnswer(false);
    
    // Refresh questions and stats
    fetchDueQuestions();
    fetchLearningStats();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SOLVED':
        return 'bg-green-50 text-green-700';
      case 'PENDING':
        return 'bg-yellow-50 text-yellow-700';
      case 'SKIPPED':
        return 'bg-red-50 text-red-700';
      case 'REVIEWED':
        return 'bg-blue-50 text-blue-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SOLVED':
        return '已解决';
      case 'PENDING':
        return '待解决';
      case 'SKIPPED':
        return '已跳过';
      case 'REVIEWED':
        return '已复习';
      default:
        return status;
    }
  };

  const getSubjectsByCategory = () => {
    // Group mastered questions by subject for display
    const groupedQuestions: { [key: string]: Question[] } = {};
    
    masteredQuestions.forEach(question => {
      const subjectId = question.subject.id;
      if (!groupedQuestions[subjectId]) {
        groupedQuestions[subjectId] = [];
      }
      groupedQuestions[subjectId].push(question);
    });
    
    return groupedQuestions;
  };

  // Review mode UI
  if (reviewMode && currentReviewQuestion) {
    return (
      <div className="container mx-auto p-4 min-h-screen flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <button 
            onClick={exitReview}
            className="text-gray-600"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            返回
          </button>
          <div className="text-sm">
            <span className="font-bold text-indigo-600">{stats.todayCompleted + 1}</span>
            <span className="text-gray-600">/{stats.todayGoal}</span>
          </div>
        </div>

        <div className="flex-grow flex flex-col bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex items-center mb-4">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
              style={{ 
                backgroundColor: `${currentReviewQuestion.subject.color}25`, 
                color: currentReviewQuestion.subject.color 
              }}
            >
              <i className={`fas fa-${currentReviewQuestion.subject.icon || 'book'}`}></i>
            </div>
            <div>
              <h3 className="font-medium">{currentReviewQuestion.subject.name}</h3>
              <p className="text-xs text-gray-500">复习次数: {currentReviewQuestion.reviewCount || 0}</p>
            </div>
          </div>

          <div className="flex-grow">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">题目:</h2>
              <p className="text-gray-800">{currentReviewQuestion.text}</p>
            </div>

            {currentReviewQuestion.images.length > 0 && (
              <div className="mb-6">
                <div className="flex gap-2 overflow-x-auto">
                  {currentReviewQuestion.images.map(image => (
                    <div key={image.id} className="flex-shrink-0 rounded overflow-hidden">
                      <Image 
                        src={image.url} 
                        alt="Question" 
                        width={200} 
                        height={150} 
                        className="object-contain"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showAnswer ? (
              <div className="mt-6">
                <div className="p-3 bg-red-50 rounded mb-3">
                  <h3 className="text-red-700 font-semibold mb-1">错误答案:</h3>
                  <p>{currentReviewQuestion.notes}</p>
                </div>
                
                <div className="p-3 bg-green-50 rounded mb-6">
                  <h3 className="text-green-700 font-semibold mb-1">正确答案:</h3>
                  <p>{currentReviewQuestion.answer}</p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">你的记忆程度如何?</h3>
                  <div className="grid grid-cols-4 gap-2">
                    <button 
                      onClick={() => rateAnswer('again')}
                      className="py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      忘记了
                    </button>
                    <button 
                      onClick={() => rateAnswer('hard')}
                      className="py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      困难
                    </button>
                    <button 
                      onClick={() => rateAnswer('good')}
                      className="py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      一般
                    </button>
                    <button 
                      onClick={() => rateAnswer('easy')}
                      className="py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      简单
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-grow flex items-center justify-center">
                <button 
                  onClick={revealAnswer}
                  className="py-3 px-6 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  显示答案
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Dashboard UI (normal mode)
  return (
    <div className="container mx-auto p-4 pb-16">
      <h1 className="text-2xl font-bold mb-6">{t('home')}</h1>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 flex justify-between">
          <div>{error}</div>
          <button onClick={() => setError('')} className="text-red-700">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
      
      {/* Daily Goal Card */}
      <div className="bg-indigo-50 rounded-lg shadow p-4 mb-6 flex">
        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-xl text-indigo-600 mr-4">
          <i className="fas fa-trophy"></i>
        </div>
        <div className="flex-1">
          <div className="text-lg font-semibold text-gray-800 mb-1">今日学习目标</div>
          <div className="text-sm text-gray-600 mb-2">每天复习 {stats.todayGoal} 道错题，提高知识掌握</div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">今日进度</span>
              <span className="font-medium">{stats.todayCompleted}/{stats.todayGoal}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 rounded-full" 
                style={{ width: `${(stats.todayCompleted / Math.max(1, stats.todayGoal)) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            <i className="fas fa-chart-line text-indigo-600 mr-2"></i>
            学习概况
          </h2>
          <button 
            className="text-sm text-indigo-600"
            onClick={() => router.push(`/${locale}/stats`)}
          >
            查看详情
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-gray-50 rounded p-3 text-center">
            <div className="text-xl font-bold text-indigo-600 mb-1">{stats.totalQuestions}</div>
            <div className="text-xs text-gray-600">收集错题</div>
          </div>
          <div className="bg-gray-50 rounded p-3 text-center">
            <div className="text-xl font-bold text-indigo-600 mb-1">{stats.masteredQuestions}</div>
            <div className="text-xs text-gray-600">已掌握</div>
          </div>
          <div className="bg-gray-50 rounded p-3 text-center">
            <div className="text-xl font-bold text-indigo-600 mb-1">{stats.learningDays}</div>
            <div className="text-xs text-gray-600">学习天数</div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center mb-2">
            <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
            <span className="font-medium text-gray-800">学习小贴士</span>
          </div>
          <p className="text-sm text-gray-600">
            根据艾宾浩斯遗忘曲线，在最佳时间进行间隔复习能提高记忆效率。错题宝会为你安排最佳复习时间！
          </p>
        </div>
      </div>
      
      {/* Review Queue */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            <i className="fas fa-clock text-indigo-600 mr-2"></i>
            待复习错题
          </h2>
          <button 
            className="text-sm text-indigo-600"
            onClick={() => router.push(`/${locale}/collection`)}
          >
            查看全部
          </button>
        </div>
        
        {/* Subject filter */}
        <div className="mb-4 overflow-x-auto">
          <div className="flex space-x-2 pb-2">
            <div 
              className={`px-3 py-1 ${selectedSubjectId === null ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'} rounded-full text-sm cursor-pointer whitespace-nowrap`}
              onClick={() => handleSubjectFilter(null)}
            >
              全部
            </div>
            
            {subjects.map(subject => (
              <div 
                key={subject.id}
                className={`px-3 py-1 ${selectedSubjectId === subject.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'} rounded-full text-sm whitespace-nowrap cursor-pointer`}
                onClick={() => handleSubjectFilter(subject.id)}
              >
                {subject.name}
              </div>
            ))}
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : questions.length > 0 ? (
          <>
            <div className="divide-y">
              {questions
                .map(question => (
                <div key={question.id} className="py-3">
                  <div className="flex items-center mb-2">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center mr-2"
                      style={{ backgroundColor: `${question.subject.color}25`, color: question.subject.color }}
                    >
                      <i className={`fas fa-${question.subject.icon || 'book'}`}></i>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{question.subject.name}</h3>
                      <p className="text-xs text-gray-500">复习次数: {question.reviewCount || 0}</p>
                    </div>
                    <div className={`${getStatusColor(question.status)} text-xs px-2 py-1 rounded`}>
                      {getStatusText(question.status)}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-800 mb-2 line-clamp-2">{question.text}</p>
                  
                  <div className="flex justify-between text-xs text-gray-500">
                    <div>添加于: {formatDate(question.createdAt)}</div>
                    <div className="flex">
                      <div className="flex items-center mr-3">
                        <i className="fas fa-clock mr-1"></i>
                        今日待复习
                      </div>
                      {[1, 2, 3, 4, 5].map(star => (
                        <i 
                          key={star}
                          className={`${star <= parseInt(question.difficulty) ? 'fas' : 'far'} fa-star text-yellow-500 text-xs ml-0.5`}
                        ></i>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4">
              <button 
                onClick={startReview}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                开始今日复习
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl text-gray-300 mb-3">
              <i className="fas fa-check-circle"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-1">
              {stats.todayCompleted > 0 ? "今日已完成全部复习" : "暂无待复习错题"}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {stats.todayCompleted > 0 
                ? "做得好！你已复习完今天的所有错题。明天再继续保持！" 
                : "可以在'添加'页面收集错题，或者等待已添加错题进入复习计划。"}
            </p>
            {stats.totalQuestions === 0 && (
              <button 
                onClick={() => router.push(`/${locale}/add`)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"
              >
                <i className="fas fa-plus mr-2"></i>
                去添加第一道错题
              </button>
            )}
          </div>
        )}
        
        {pagination.remaining > 0 && (
          <div className="mt-3 text-center text-sm text-gray-500">
            还有 {pagination.remaining} 道题待复习
          </div>
        )}
      </div>
      
      {/* Previously Mastered Questions */}
      {masteredQuestions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">
            <i className="fas fa-check-circle text-green-600 mr-2"></i>
            已掌握错题
          </h2>
          
          {Object.entries(getSubjectsByCategory()).map(([subjectId, questions]) => {
            const subject = subjects.find(s => s.id === subjectId);
            return (
              <div key={subjectId} className="mb-3">
                <div className="flex justify-between items-center">
                  <div className="font-medium">{subject?.name || '未知科目'}</div>
                  <div className="text-sm text-gray-500">{questions.length}题</div>
                </div>
                
                {questions.slice(0, 2).map(question => (
                  <div key={question.id} className="py-2 border-b">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-2"
                          style={{ backgroundColor: `${subject?.color || '#e5e7eb'}25`, color: subject?.color || '#6b7280' }}>
                        <i className={`fas fa-${subject?.icon || 'book'}`}></i>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{question.text}</p>
                      </div>
                      <div className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded">
                        已掌握
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 