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
  serverExternalPackages: ['@supabase/ssr', '@supabase/auth-helpers-nextjs'],
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
  // Fix for Radix UI bundling issue
  transpilePackages: [
    '@radix-ui/react-accordion',
    '@radix-ui/react-alert-dialog',
    '@radix-ui/react-checkbox',
    '@radix-ui/react-dialog',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-label',
    '@radix-ui/react-radio-group',
    '@radix-ui/react-select',
    '@radix-ui/react-slot',
    '@radix-ui/react-toast',
    '@radix-ui/primitive',
  ],
};

module.exports = nextConfig; 