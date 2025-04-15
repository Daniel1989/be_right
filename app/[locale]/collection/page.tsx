'use client';

import { useTranslations } from 'next-intl';

export default function CollectionPage() {
  const t = useTranslations('navigation');

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">{t('collection')}</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">My Collection</h2>
        <p className="text-gray-600">
          This is a placeholder for the collection page. Here you will see all your saved error questions and learning materials.
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium">Subject Filters</h3>
          <button className="text-indigo-600 text-sm">View All</button>
        </div>
        
        <div className="flex overflow-x-auto pb-2 space-x-2">
          <div className="px-3 py-1 bg-indigo-600 text-white rounded-full text-sm whitespace-nowrap">All</div>
          <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm whitespace-nowrap">Math</div>
          <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm whitespace-nowrap">Physics</div>
          <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm whitespace-nowrap">Chemistry</div>
          <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm whitespace-nowrap">Biology</div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow divide-y">
        <div className="p-4 flex items-center">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 mr-3">
            <i className="fas fa-calculator"></i>
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-sm">Sample Math Problem</h3>
            <p className="text-xs text-gray-500 mt-1">Added on: 2023-06-15</p>
          </div>
          <div className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded">Mastered</div>
        </div>
        
        <div className="p-4 flex items-center">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mr-3">
            <i className="fas fa-atom"></i>
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-sm">Sample Physics Problem</h3>
            <p className="text-xs text-gray-500 mt-1">Added on: 2023-06-14</p>
          </div>
          <div className="bg-yellow-50 text-yellow-700 text-xs px-2 py-1 rounded">Learning</div>
        </div>
      </div>
    </div>
  );
} 