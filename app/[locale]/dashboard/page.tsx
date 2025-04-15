'use client';

import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  const t = useTranslations('navigation');

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">{t('home')}</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Dashboard Content</h2>
        <p className="text-gray-600">
          This is a placeholder for the dashboard page. Here you will see your main overview and daily tasks.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-medium mb-2">Recent Activity</h3>
          <p className="text-sm text-gray-500">No recent activity to display</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-medium mb-2">Today's Tasks</h3>
          <p className="text-sm text-gray-500">No tasks scheduled for today</p>
        </div>
      </div>
    </div>
  );
} 