'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/app/hooks/useAuth';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations('auth');
  const t2 = useTranslations('app');
  const { login, error: authError } = useAuth();

  // Get callback URL from search params if it exists
  const callbackUrl = searchParams?.get('callbackUrl') || undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await login({ email, password }, callbackUrl);
      
      if (!success) {
        setError(authError || t('login.invalidCredentials'));
      }
    } catch (error) {
      setError(t('login.error'));
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="mt-16 mb-10 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-indigo-600">{t2('title')}</h1>
        <p className="text-gray-500 mt-2">{t('login.tagline')}</p>
      </div>

      <form className="w-full max-w-sm px-6 mx-auto" onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <div className="mb-5">
          <label htmlFor="email" className="block mb-2 font-medium text-gray-700">
            {t('login.email')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
            <input
              id="email"
              type="email"
              className="w-full p-3 pl-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder={t('login.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="mb-5">
          <label htmlFor="password" className="block mb-2 font-medium text-gray-700">
            {t('login.password')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              id="password"
              type="password"
              className="w-full p-3 pl-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder={t('login.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {/* <Link href={`/${locale}/auth/forgot-password`} className="block text-right mt-2 text-sm text-indigo-600 hover:text-indigo-700">
            {t('login.forgotPassword')}
          </Link> */}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-4 py-3 px-5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:translate-y-[-2px] hover:shadow-lg transition-all duration-200"
        >
          {isLoading ? t('login.loggingIn') : t('login.submit')}
        </button>

        {/* <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-gray-200"></div>
          <div className="px-4 text-sm text-gray-400">{t('login.orContinueWith')}</div>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div> */}

        {/* <div className="flex justify-center space-x-4">
          <button type="button" className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
            <svg className="h-5 w-5 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm6.2 19.1a1 1 0 0 1-1.4-1.3 5.2 5.2 0 0 0 1.1-3.2c0-1.4-.5-2.7-1.5-3.8-.9 1.1-2.2 1.9-3.6 2.3a2 2 0 0 1-1.8-.2 2 2 0 0 1-.8-1.7v-.1a6 6 0 0 1 1.8-4.3 6 6 0 0 1 8.4 0A8.4 8.4 0 0 1 22 12a9.9 9.9 0 0 1-2.4 6.5c-.5.6-1 .5-1.4.6z" />
            </svg>
          </button>
          <button type="button" className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
            <svg className="h-5 w-5 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.13 0H1.87A1.88 1.88 0 0 0 0 1.88v20.25A1.88 1.88 0 0 0 1.88 24h20.25A1.88 1.88 0 0 0 24 22.12V1.88A1.88 1.88 0 0 0 22.13 0zM13.5 20.2h-3v-9.68h3v9.68zm-1.5-11.36a1.58 1.58 0 0 1-1.64-1.62c0-.89.73-1.62 1.64-1.62.91 0 1.64.73 1.64 1.62 0 .9-.73 1.62-1.64 1.62zm11.5 11.36h-3v-5.31c0-1.1-.2-1.95-1.47-1.95a1.65 1.65 0 0 0-1.53.93c-.12.23-.13.48-.13.74v5.59h-3s.02-9.6 0-10.59h3v1.82a2.78 2.78 0 0 1 2.66-1.37c2.06 0 3.47 1.3 3.47 4.14v5.99z" />
            </svg>
          </button>
          <button type="button" className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
            <svg className="h-5 w-5 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 24C5.37 24 0 18.63 0 12S5.37 0 12 0s12 5.37 12 12-5.37 12-12 12zm0-23C5.92 1 1 5.92 1 12s4.92 11 11 11 11-4.92 11-11S18.08 1 12 1z" />
              <path d="M18.29 15.71c-.2.18-.49.29-.71.29-.21 0-.42-.07-.6-.2-3.93-2.95-9.04-2.95-12.98 0-.19.14-.4.2-.6.2-.22 0-.51-.11-.71-.29a.996.996 0 0 1-.09-1.4c4.5-3.77 10.58-3.77 15.08 0 .38.32.43.88.11 1.4z" />
              <path d="M16.1 13.1c-.21 0-.43-.08-.59-.24C13.6 11.1 10.4 11.1 8.49 12.86c-.34.31-.88.29-1.19-.06a.836.836 0 0 1 .06-1.19c2.49-2.23 6.28-2.23 8.77 0 .34.31.36.85.06 1.19-.17.17-.38.24-.59.24z" />
              <path d="M13.92 10.5c-.19 0-.38-.06-.52-.19a1.55 1.55 0 0 0-1.87-.01c-.14.12-.33.18-.52.18-.23 0-.45-.1-.59-.27-.23-.32-.18-.76.13-1.01.81-.61 1.82-.92 2.81-.92.99 0 2 .31 2.81.92a.736.736 0 0 1 .13 1.01c-.14.17-.36.27-.59.27z" />
            </svg>
          </button>
        </div> */}
      </form>

      <div className="mt-auto text-center p-6 text-sm text-gray-500">
        {t('login.noAccount')} {' '}
        <Link href={`/${locale}/auth/register`} className="font-semibold text-indigo-600 hover:text-indigo-700">
          {t('login.register')}
        </Link>
      </div>
    </div>
  );
} 