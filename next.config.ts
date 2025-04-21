import type { NextConfig } from 'next';
import withNextIntl from 'next-intl/plugin';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ywfedps.oss-cn-hangzhou.aliyuncs.com',
      },
    ],
  },
};

export default withNextIntl('./i18n.ts')(nextConfig);
