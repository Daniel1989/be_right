import { NextIntlClientProvider } from 'next-intl';
import { Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import '../ui/global.css';
import { defaultLocale, locales } from '../../middleware';
import BottomNav from '../components/BottomNav';
import { AuthProvider } from '../providers/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export function generateStaticParams() {
  return locales.map(locale => ({ locale }));
}

// Function to load a translation file with fallback
async function loadTranslations(locale: string, namespace: string) {
  try {
    return (await import(`../../messages/${locale}/${namespace}.json`)).default;
  } catch (error) {
    console.error(`Failed to load ${namespace} messages for locale: ${locale}`, error);
    try {
      return (await import(`../../messages/${defaultLocale}/${namespace}.json`)).default;
    } catch (fallbackError) {
      console.error(`Failed to load even default ${namespace} messages`, fallbackError);
      return {};
    }
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Await the params before destructuring
  const { locale } = await params;
  
  // Validate that the incoming locale parameter is valid
  if (!locales.includes(locale)) {
    // If not found, redirect to the 404 page
    notFound();
  }

  // Load all translation namespaces
  const commonMessages = await loadTranslations(locale, 'common');
  const profileMessages = await loadTranslations(locale, 'profile');
  
  // Combine all messages into a single object
  const messages = {
    ...commonMessages,
    profile: profileMessages
  };

  return (
    <html lang={locale} className={inter.className}>
      <head>
        <title>错题宝 - 失败是成功之母</title>
        <meta name="description" content="Spaced repetition app for reviewing and mastering academic errors" />
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer" 
        />
      </head>
      <body className="pb-16">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <main className="min-h-screen flex flex-col">{children}</main>
            <BottomNav />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
} 