'use client';

import { useTranslations } from 'next-intl';
import { logoutUser } from '@/app/lib/actions/user.actions';

export default function ProfilePage() {
  const t = useTranslations('navigation');

  const handleLogout = async () => {
    await logoutUser();
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">{t('profile')}</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="bg-indigo-600 p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-white mx-auto mb-3 flex items-center justify-center text-indigo-600">
            <i className="fas fa-user text-3xl"></i>
          </div>
          <h2 className="text-xl font-bold text-white">Test User</h2>
          <p className="text-indigo-200 text-sm">test@example.com</p>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <div className="text-center mb-4">
              <div className="inline-flex items-center bg-indigo-50 px-3 py-1 rounded-full text-indigo-600 text-sm">
                <i className="fas fa-medal mr-2"></i>
                Self-discipline Score: 860
              </div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Learning Achievements</span>
              <span>86/100</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600" style={{ width: '86%' }}></div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="p-3 border border-gray-200 rounded-lg flex items-center">
              <i className="fas fa-cog text-gray-400 mr-3"></i>
              <span className="flex-1">Settings</span>
              <i className="fas fa-chevron-right text-gray-400"></i>
            </div>
            
            <div className="p-3 border border-gray-200 rounded-lg flex items-center">
              <i className="fas fa-bell text-gray-400 mr-3"></i>
              <span className="flex-1">Notifications</span>
              <i className="fas fa-chevron-right text-gray-400"></i>
            </div>
            
            <div className="p-3 border border-gray-200 rounded-lg flex items-center">
              <i className="fas fa-shield-alt text-gray-400 mr-3"></i>
              <span className="flex-1">Privacy</span>
              <i className="fas fa-chevron-right text-gray-400"></i>
            </div>
            
            <div className="p-3 border border-gray-200 rounded-lg flex items-center">
              <i className="fas fa-question-circle text-gray-400 mr-3"></i>
              <span className="flex-1">Help & Support</span>
              <i className="fas fa-chevron-right text-gray-400"></i>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full p-3 border border-red-200 text-red-600 rounded-lg flex items-center justify-center mt-6"
            >
              <i className="fas fa-sign-out-alt mr-2"></i>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 