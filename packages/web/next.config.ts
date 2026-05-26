import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@open-travel-agent/shared-types',
    '@open-travel-agent/agent-core',
    '@open-travel-agent/provider-mock',
    '@open-travel-agent/provider-duffel',
  ],
};

export default nextConfig;
