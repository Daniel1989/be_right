// Declaring module to help TypeScript recognize next-intl components and hooks
declare module 'next-intl' {
  import { ReactNode } from 'react';

  export function useTranslations(namespace?: string): (key: string, values?: Record<string, any>) => string;
  export function useLocale(): string;

  export interface NextIntlClientProviderProps {
    locale: string;
    messages: Record<string, any>;
    children: ReactNode;
  }

  export function NextIntlClientProvider(props: NextIntlClientProviderProps): JSX.Element;
}

// Middleware typings
declare module 'next-intl/middleware' {
  import { NextRequest, NextResponse } from 'next/server';

  interface MiddlewareConfig {
    locales: string[];
    defaultLocale: string;
    localeDetection?: boolean;
    pathnames?: Record<string, string>;
  }

  export default function createMiddleware(config: MiddlewareConfig): 
    (request: NextRequest) => NextResponse | undefined;
}

// Server utilities
declare module 'next-intl/server' {
  interface GetRequestConfigParams {
    locale: string;
  }

  interface RequestConfig {
    messages: Record<string, any>;
  }

  export function getRequestConfig(fn: (params: GetRequestConfigParams) => 
    RequestConfig | Promise<RequestConfig>): (params: GetRequestConfigParams) => 
    Promise<RequestConfig>;
} 