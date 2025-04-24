'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

// Add Chart.js type declaration for window object
declare global {
  interface Window {
    Chart: any;
  }
}

// Define types
type SubjectProgress = {
  id: string;
  name: string;
  progress: number;
  color: string;
  icon: string;
  totalQuestions: number;
};

type RankItem = {
  position: number;
  id: string;
  name: string;
  stats: string;
  score: number;
  avatar: string;
  isCurrentUser: boolean;
};

type StatsData = {
  overview?: {
    totalQuestions: number;
    masteredQuestions: number;
    pendingQuestions: number;
    masteryRate: number;
  };
  chart?: {
    labels: string[];
    collected: number[];
    mastered: number[];
  };
  calendar?: Array<{
    date: number;
    isEmpty: boolean;
    errorCount: number;
    isToday?: boolean;
  }>;
  subjects?: SubjectProgress[];
  rankings?: RankItem[];
  streak?: {
    current: number;
    best: number;
  };
};

export default function StatsPage() {
  const t = useTranslations('navigation');
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year' | 'total'>('week');
  const [statsData, setStatsData] = useState<StatsData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  
  // Fetch summary data
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setIsSummaryLoading(true);
        const response = await fetch(`/${locale}/api/stats/summary`);
        
        if (!response.ok) {
          throw new Error('Failed to load summary');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setSummary(data.data.summary);
        } else {
          throw new Error(data.error || 'Failed to load summary');
        }
      } catch (err) {
        console.error('Error fetching summary:', err);
        // For summary, we'll just hide it on error rather than showing an error message
        setSummary('');
      } finally {
        setIsSummaryLoading(false);
      }
    };
    
    fetchSummary();
  }, [locale]);
  
  // Fetch data from API when time filter changes
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/${locale}/api/stats?period=${timeFilter}`);
        
        if (!response.ok) {
          throw new Error('Failed to load statistics');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setStatsData(data.data);
        } else {
          throw new Error(data.error || 'Failed to load statistics');
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, [timeFilter, locale]);
  
  // Initialize chart when chart data changes
  useEffect(() => {
    if (
      typeof window !== 'undefined' && 
      window.Chart && 
      statsData.chart && 
      !isLoading && 
      document.getElementById('errorStatsChart')
    ) {
      const ctx = document.getElementById('errorStatsChart') as HTMLCanvasElement;
      if (ctx) {
        // Destroy existing chart if any
        const chartInstance = window.Chart.getChart(ctx);
        if (chartInstance) {
          chartInstance.destroy();
        }
        
        const chart = new window.Chart(ctx, {
          type: 'line',
          data: {
            labels: statsData.chart.labels,
            datasets: [
              {
                label: '已收集错题',
                data: statsData.chart.collected,
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderColor: '#4F46E5',
                borderWidth: 2,
                tension: 0.4,
                fill: true
              },
              {
                label: '已掌握错题',
                data: statsData.chart.mastered,
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderColor: '#10B981',
                borderWidth: 2,
                tension: 0.4,
                fill: true
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'bottom',
                labels: {
                  usePointStyle: true,
                  boxWidth: 6,
                  padding: 20
                }
              },
              tooltip: {
                mode: 'index',
                intersect: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  display: true,
                  color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                  precision: 0
                }
              },
              x: {
                grid: {
                  display: false
                }
              }
            }
          }
        });
      }
    }
  }, [statsData.chart, isLoading]);

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      <div className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">{t('stats')}</h1>
            <button className="p-2 rounded-full bg-gray-100 text-gray-600">
              <i className="fas fa-share-alt"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        {/* AI-generated Summary */}
        {!isSummaryLoading && summary && (
          <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
            <div className="flex items-center mb-3">
              <i className="fas fa-robot text-indigo-600 mr-2 text-lg"></i>
              <h2 className="text-base font-semibold">学习助手</h2>
            </div>
            <p className="text-gray-700">{summary}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-indigo-600 border-t-transparent" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        )}
        
        {!isLoading && !error && (
          <>
            {/* Time filter */}
            <div className="flex bg-gray-100 rounded-lg overflow-hidden mb-4">
              {(['week', 'month', 'year', 'total'] as const).map((period) => (
                <button
                  key={period}
                  className={`flex-1 py-2 text-center text-sm ${
                    timeFilter === period ? 'bg-indigo-600 text-white' : 'text-gray-500'
                  }`}
                  onClick={() => setTimeFilter(period)}
                >
                  {period === 'week' ? '周' : 
                   period === 'month' ? '月' : 
                   period === 'year' ? '年' : '总计'}
                </button>
              ))}
            </div>

            {/* Stats Overview */}
            <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold flex items-center">
                  <i className="fas fa-chart-line text-indigo-600 mr-2"></i>
                  数据概览
                </h2>
                <span className="text-sm text-gray-500">
                  {timeFilter === 'week' ? '本周' : 
                   timeFilter === 'month' ? '本月' : 
                   timeFilter === 'year' ? '今年' : '总计'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {statsData.overview?.totalQuestions || 0}
                  </div>
                  <div className="text-xs text-gray-500">已收集错题</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {statsData.overview?.masteredQuestions || 0}
                  </div>
                  <div className="text-xs text-gray-500">已掌握错题</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {statsData.overview?.pendingQuestions || 0}
                  </div>
                  <div className="text-xs text-gray-500">待复习错题</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {statsData.overview?.masteryRate || 0}%
                  </div>
                  <div className="text-xs text-gray-500">掌握率</div>
                </div>
              </div>

              {/* <div className="h-48 relative">
                <canvas id="errorStatsChart"></canvas>
              </div> */}
            </div>

            {/* Learning Heat */}
            <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
              <div className="flex items-center mb-4">
                <i className="fas fa-fire text-indigo-600 mr-2"></i>
                <h2 className="text-base font-semibold">学习热度</h2>
              </div>

              {/* Calendar Header */}
              <div className="grid grid-cols-7 mb-2">
                {['一', '二', '三', '四', '五', '六', '日'].map(day => (
                  <div key={day} className="text-center text-xs text-gray-400">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {(statsData.calendar || []).map((day, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center justify-center h-8 text-xs rounded-md relative
                      ${day.isToday ? 'border-2 border-indigo-600 font-bold' : ''}
                      ${day.isEmpty ? 'bg-gray-100' : day.errorCount > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-white'}`}
                  >
                    {day.date}
                    {day.errorCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[10px]">
                        {day.errorCount}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Learning Streak */}
              <div className="flex items-center justify-center">
                <div className="text-yellow-500 text-xl mr-2">
                  <i className="fas fa-fire"></i>
                </div>
                <div className="text-gray-700 font-medium">
                  已连续学习 <span className="text-yellow-500 font-bold">{statsData.streak?.current || 0}</span> 天
                </div>
              </div>
            </div>

            {/* Subject Progress */}
            <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
              <div className="flex items-center mb-4">
                <i className="fas fa-graduation-cap text-indigo-600 mr-2"></i>
                <h2 className="text-base font-semibold">学科掌握情况</h2>
              </div>

              <div className="space-y-3">
                {(statsData.subjects || []).map((subject, index) => (
                  <div key={subject.id} className="flex items-center">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white mr-3"
                      style={{ backgroundColor: subject.color }}
                    >
                      <i className={`fas fa-${subject.icon}`}></i>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">{subject.name}</span>
                        <span className="font-medium">{subject.progress}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full" 
                          style={{ width: `${subject.progress}%`, backgroundColor: subject.color }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rankings */}
            <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <i className="fas fa-trophy text-indigo-600 mr-2"></i>
                  <h2 className="text-base font-semibold">排行榜</h2>
                </div>
              </div>

              <div>
                {(statsData.rankings || []).map((rank, index) => (
                  <div key={rank.id} className="flex items-center py-3 border-b border-gray-100 last:border-0">
                    <div 
                      className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold mr-3 
                        ${rank.position === 1 ? 'bg-yellow-100 text-yellow-600' : 
                          rank.position === 2 ? 'bg-gray-100 text-gray-600' : 
                          rank.position === 3 ? 'bg-red-100 text-red-600' : 
                          'bg-gray-100 text-gray-500'}`}
                    >
                      {rank.position}
                    </div>
                    {/* <div className="w-9 h-9 rounded-full overflow-hidden mr-3">
                      <Image 
                        src={rank.avatar} 
                        alt={rank.name} 
                        width={36} 
                        height={36} 
                        className="w-full h-full object-cover"
                      />
                    </div> */}
                    <div className="flex-1">
                      <div className={`font-medium text-sm ${rank.isCurrentUser ? 'text-indigo-600' : ''}`}>
                        {rank.name}
                      </div>
                      <div className="text-xs text-gray-500">{rank.stats}</div>
                    </div>
                    <div className="text-indigo-600 font-bold">{rank.score}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add script to load Chart.js */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if (typeof window !== 'undefined' && !window.Chart) {
              const script = document.createElement('script');
              script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
              script.async = true;
              document.body.appendChild(script);
            }
          `,
        }}
      />

      {/* Add Font Awesome */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if (typeof window !== 'undefined' && !document.querySelector('link[href*="font-awesome"]')) {
              const link = document.createElement('link');
              link.rel = 'stylesheet';
              link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
              document.head.appendChild(link);
            }
          `,
        }}
      />
    </div>
  );
} 