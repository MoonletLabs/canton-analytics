/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // Canton Explorer API – single source for analytics
      {
        source: '/api/ccexplorer-proxy/:path*',
        destination: 'https://api.ccexplorer.io/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
