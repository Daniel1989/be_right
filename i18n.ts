import {getRequestConfig} from 'next-intl/server';
import {defaultLocale, locales} from './middleware';

export default getRequestConfig(async ({locale}) => {
  // Validate locale and fall back to default if undefined or invalid
  const validLocale = locale && locales.includes(locale) ? locale : defaultLocale;
  
  return {
    locale: validLocale,
    messages: (await import(`./messages/${validLocale}/common.json`)).default
  };
}); 