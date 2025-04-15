import { NextIntlClientProvider } from 'next-intl';
import { Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import '../ui/global.css';
import { defaultLocale, locales } from '../../middleware';
import BottomNav from '../components/BottomNav';

const inter = Inter({ subsets: ['latin'] });

export function generateStaticParams() {
  return locales.map(locale => ({ locale }));
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

  let messages;
  try {
    messages = (await import(`../../messages/${locale}/common.json`)).default;
  } catch (error) {
    console.error(`Failed to load messages for locale: ${locale}`, error);
    // If messages can't be loaded, try to use the default locale
    try {
      messages = (await import(`../../messages/${defaultLocale}/common.json`)).default;
    } catch (fallbackError) {
      console.error('Failed to load even default messages', fallbackError);
      notFound();
    }
  }

  return (
    <html lang={locale} className={inter.className}>
      <head>
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
          <main className="min-h-screen flex flex-col">{children}</main>
          <BottomNav />
        </NextIntlClientProvider>
      </body>
    </html>
  );
} 