'use client';

import { useTranslations } from 'next-intl';

export default function StatsPage() {
  const t = useTranslations('navigation');

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">{t('stats')}</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Learning Statistics</h2>
        <p className="text-gray-600 mb-4">
          This is a placeholder for the statistics page. Here you will see your learning progress and achievements.
        </p>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-indigo-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-indigo-600">42</div>
            <div className="text-xs text-gray-500 mt-1">Total Items</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">28</div>
            <div className="text-xs text-gray-500 mt-1">Mastered</div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">14</div>
            <div className="text-xs text-gray-500 mt-1">In Progress</div>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="font-medium text-sm mb-2">Learning Streak</h3>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600" style={{ width: '65%' }}></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Current: 8 days</span>
            <span>Best: 12 days</span>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium text-sm mb-2">Subject Distribution</h3>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Mathematics</span>
                <span>15 items</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600" style={{ width: '35%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Physics</span>
                <span>12 items</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600" style={{ width: '28%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Chemistry</span>
                <span>10 items</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-600" style={{ width: '24%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Biology</span>
                <span>5 items</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-600" style={{ width: '13%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 