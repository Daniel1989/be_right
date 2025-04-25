'use client';

import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuthContext } from '@/app/providers/AuthProvider';
import { message } from 'antd';

export default function ProfilePage() {
  // Common translations at root level
  const t = useTranslations();
  // Navigation translations
  const tNav = useTranslations('navigation');
  // Profile-specific translations
  const tProfile = useTranslations('profile');
  
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en'; // Extract locale from path
  const { user, logout, fetchCurrentUser } = useAuthContext();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(1);
  const [originalGoal, setOriginalGoal] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  // Fetch current settings on component mount
  useEffect(() => {
    fetchSettings();
    fetchCurrentUser();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`/${locale}/api/learning-stats/settings`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setDailyGoal(data.data.dailyGoal || 10);
          setOriginalGoal(data.data.dailyGoal || 10);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setDailyGoal(isNaN(value) ? 0 : Math.max(1, Math.min(50, value)));
  };

  const saveGoalSettings = async () => {
    if (dailyGoal === originalGoal) return;
    
    try {
      setIsSaving(true);
      setSaveMessage('');
      
      const response = await fetch(`/${locale}/api/learning-stats/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dailyGoal,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSaveMessage(tProfile('settingsSavedSuccess'));
          setOriginalGoal(dailyGoal);
          setTimeout(() => setSaveMessage(''), 3000);
        } else {
          throw new Error(data.error || tProfile('settingsSaveError'));
        }
      } else {
        throw new Error(tProfile('settingsSaveError'));
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage(tProfile('settingsSaveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      // Call the API to logout
      const response = await fetch(`/${locale}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Logout failed:', data);
        throw new Error(data.error || tProfile('logoutFailed'));
      }
      
      // Update auth context (if using auth context)
      if (logout) {
        await logout();
      }
      // Redirect to login page
      router.push(`/${locale}/auth/login`);
      router.refresh();
    } catch (error) {
      console.error('Error during logout:', error);
      message.error(tProfile('logoutErrorAlert'));
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">{tNav('profile')}</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="bg-indigo-600 p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-white mx-auto mb-3 flex items-center justify-center text-indigo-600">
            <i className="fas fa-user text-3xl"></i>
          </div>
          <h2 className="text-xl font-bold text-white">{user?.name || tProfile('guestUser')}</h2>
          <p className="text-indigo-200 text-sm">{user?.email || tProfile('notLoggedIn')}</p>
        </div>
        
        <div className="p-6">
          {/* <div className="mb-6">
            <div className="text-center mb-4">
              <div className="inline-flex items-center bg-indigo-50 px-3 py-1 rounded-full text-indigo-600 text-sm">
                <i className="fas fa-medal mr-2"></i>
                {tProfile('selfDisciplineScore')}: 860
              </div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{tProfile('learningAchievements')}</span>
              <span>86/100</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600" style={{ width: '86%' }}></div>
            </div>
          </div> */}
          
          {/* Daily Review Goal Setting */}
          <div className="mb-6 p-4 border border-indigo-100 rounded-lg bg-indigo-50">
            <h3 className="text-lg font-semibold text-indigo-700 mb-3">
              <i className="fas fa-tasks mr-2"></i>
              {tProfile('dailyReviewGoal')}
            </h3>
            
            <p className="text-sm text-gray-600 mb-3">
              {tProfile('dailyGoalDescription')}
            </p>
            
            <div className="flex items-center mb-2">
              {/* <input
                type="number"
                min="1"
                max="50"
                value={dailyGoal}
                onChange={handleGoalChange}
                className="w-16 p-2 border border-gray-300 rounded-lg mr-3 text-center"
              /> */}
              <span className='mr-3 text-center text-gray-600'>{dailyGoal}</span>
              <span className="text-gray-600">{tProfile('questionsPerDay')}</span>
            </div>
            
            <div className="flex items-center">
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={dailyGoal}
                onChange={handleGoalChange}
                className="flex-1 mr-3"
              />
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <div>
                {saveMessage && (
                  <span className={`text-sm ${saveMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                    {saveMessage}
                  </span>
                )}
              </div>
              <button
                onClick={saveGoalSettings}
                disabled={isSaving || dailyGoal === originalGoal}
                className={`px-4 py-2 rounded-lg ${
                  isSaving || dailyGoal === originalGoal
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {isSaving ? t('saving') : t('saveChanges')}
              </button>
            </div>
          </div>
          
          <div className="space-y-3">
            {/* <div className="p-3 border border-gray-200 rounded-lg flex items-center">
              <i className="fas fa-cog text-gray-400 mr-3"></i>
              <span className="flex-1">{tProfile('settings')}</span>
              <i className="fas fa-chevron-right text-gray-400"></i>
            </div>
            
            <div className="p-3 border border-gray-200 rounded-lg flex items-center">
              <i className="fas fa-bell text-gray-400 mr-3"></i>
              <span className="flex-1">{tProfile('notifications')}</span>
              <i className="fas fa-chevron-right text-gray-400"></i>
            </div>
            
            <div className="p-3 border border-gray-200 rounded-lg flex items-center">
              <i className="fas fa-shield-alt text-gray-400 mr-3"></i>
              <span className="flex-1">{tProfile('privacy')}</span>
              <i className="fas fa-chevron-right text-gray-400"></i>
            </div>
            
            <div className="p-3 border border-gray-200 rounded-lg flex items-center">
              <i className="fas fa-question-circle text-gray-400 mr-3"></i>
              <span className="flex-1">{tProfile('helpSupport')}</span>
              <i className="fas fa-chevron-right text-gray-400"></i>
            </div> */}
            
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`w-full p-3 border border-red-200 text-red-600 rounded-lg flex items-center justify-center mt-6 ${
                isLoggingOut ? 'opacity-60 cursor-not-allowed' : 'hover:bg-red-50'
              }`}
            >
              {isLoggingOut ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  {tProfile('loggingOut')}
                </>
              ) : (
                <>
                  <i className="fas fa-sign-out-alt mr-2"></i>
                  {tProfile('logout')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 