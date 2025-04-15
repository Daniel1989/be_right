import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get('lang') || 'en';
  
  // Simple internationalized response
  const messages = {
    en: {
      greeting: 'Hello, world!',
      message: 'Welcome to our API'
    },
    zh: {
      greeting: '你好，世界！',
      message: '欢迎使用我们的API'
    }
  };
  
  // Detect if request is from a mobile device (simple example)
  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(userAgent);
  
  // Responsive API response based on device type
  return NextResponse.json({
    ...messages[lang as keyof typeof messages],
    device: isMobile ? 'mobile' : 'desktop',
    timestamp: new Date().toISOString(),
  });
} 