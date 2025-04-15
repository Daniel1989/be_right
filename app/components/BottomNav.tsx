'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';

export default function BottomNav() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('navigation');
  
  // Hide bottom nav on auth pages
  const isAuthPage = pathname.includes('/auth/');
  if (isAuthPage) return null;
  
  // Determine if a nav item is active
  const isActive = (path: string) => {
    const localePath = `/${locale}${path}`;
    if (path === '/dashboard') {
      return pathname === `/${locale}` || pathname === `/${locale}/dashboard` || pathname.startsWith(`/${locale}/dashboard`);
    }
    return pathname.startsWith(localePath);
  };
  
  // Helper function to create localized paths
  const localePath = (path: string) => `/${locale}${path}`;
  
  return (
    <div className="bottom-nav fixed bottom-0 left-0 right-0 bg-white flex justify-around py-2 px-0 shadow-[0_-1px_3px_rgba(0,0,0,0.05)] z-10">
      <Link href={localePath('/dashboard')} className={`nav-item flex flex-col items-center text-xs ${isActive('/dashboard') ? 'text-indigo-600' : 'text-gray-500'}`}>
        <i className="fas fa-home nav-icon text-xl mb-1"></i>
        {t('home')}
      </Link>
      
      <Link href={localePath('/collection')} className={`nav-item flex flex-col items-center text-xs ${isActive('/collection') ? 'text-indigo-600' : 'text-gray-500'}`}>
        <i className="fas fa-book-open nav-icon text-xl mb-1"></i>
        {t('collection')}
      </Link>
      
      <Link href={localePath('/add')} className={`nav-item flex flex-col items-center text-xs ${isActive('/add') ? 'text-indigo-600' : 'text-gray-500'}`}>
        <i className="fas fa-plus-circle nav-icon text-xl mb-1"></i>
        {t('add')}
      </Link>
      
      <Link href={localePath('/stats')} className={`nav-item flex flex-col items-center text-xs ${isActive('/stats') ? 'text-indigo-600' : 'text-gray-500'}`}>
        <i className="fas fa-chart-line nav-icon text-xl mb-1"></i>
        {t('stats')}
      </Link>
      
      <Link href={localePath('/profile')} className={`nav-item flex flex-col items-center text-xs ${isActive('/profile') ? 'text-indigo-600' : 'text-gray-500'}`}>
        <i className="fas fa-user nav-icon text-xl mb-1"></i>
        {t('profile')}
      </Link>
    </div>
  );
} 