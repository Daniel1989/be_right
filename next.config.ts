import type { NextConfig } from 'next';
import withNextIntl from 'next-intl/plugin';

const nextConfig: NextConfig = {
  /* config options here */
};

export default withNextIntl('./i18n.ts')(nextConfig);
