'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { locales } from '../middleware';

const localeNames = {
  en: 'English',
  zh: '中文',
};

export default function LanguageSwitcher() {
  const currentLocale = useLocale();
  const locale = currentLocale && locales.includes(currentLocale) ? currentLocale : 'en';
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newLocale = e.target.value;
    startTransition(() => {
      // Extract current path and replace the locale segment
      const pathSegments = pathname.split('/');
      pathSegments[1] = newLocale; // Replace the locale segment
      const newPath = pathSegments.join('/');
      router.replace(newPath);
    });
  }

  return (
    <div className="relative">
      <select
        className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        defaultValue={locale}
        disabled={isPending}
        onChange={handleChange}
      >
        {locales.map((loc) => (
          <option key={loc} value={loc}>
            {localeNames[loc as keyof typeof localeNames]}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
        <svg 
          className="h-4 w-4 fill-current" 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 20 20"
        >
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </div>
    </div>
  );
} 