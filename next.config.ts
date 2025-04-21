import type { NextConfig } from 'next';
import withNextIntl from 'next-intl/plugin';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [new URL('http://localhost:3001/uploads/**')],
  },
};

export default withNextIntl('./i18n.ts')(nextConfig);
