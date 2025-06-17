/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      }
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  webpack: (config, { isServer }) => {
    // Suppress specific warning for @supabase/realtime-js dynamic imports
    config.module.rules.push({
      test: /node_modules\/@supabase\/realtime-js/,
      parser: {
        javascript: {
          unknownContextCritical: false,
        },
      },
    });
    
    return config;
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'referer',
            value: '(.*access_token=.*)',
          },
        ],
        permanent: false,
        destination: '/reset-password',
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/reset-password/:path*',
        destination: '/reset-password',
      },
      // Handle root URLs with hash fragments containing auth tokens
      {
        source: '/',
        has: [
          {
            type: 'query',
            key: '_access_token',
            value: '(.*)',
          },
        ],
        destination: '/reset-password',
      },
    ];
  },
};

module.exports = nextConfig; 