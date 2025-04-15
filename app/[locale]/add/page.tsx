'use client';

import { useTranslations } from 'next-intl';

export default function AddPage() {
  const t = useTranslations('navigation');

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">{t('add')}</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Add New Item</h2>
        <p className="text-gray-600 mb-4">
          This is a placeholder for the add page. Here you can add new questions or learning materials to your collection.
        </p>
        
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
              <option>Select a subject</option>
              <option>Mathematics</option>
              <option>Physics</option>
              <option>Chemistry</option>
              <option>Biology</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input type="text" className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Enter a title for your question" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
            <textarea rows={4} className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Enter your question here"></textarea>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level</label>
            <div className="flex text-yellow-500">
              <i className="fas fa-star mr-1"></i>
              <i className="fas fa-star mr-1"></i>
              <i className="fas fa-star mr-1"></i>
              <i className="far fa-star mr-1"></i>
              <i className="far fa-star"></i>
            </div>
          </div>
          
          <div className="pt-4">
            <button type="button" className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Add to Collection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 