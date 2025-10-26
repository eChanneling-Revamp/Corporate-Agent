/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Completely disable strict mode
  swcMinify: true,
  
  // Additional development optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error']
    } : false,
  },
  
  // Optimize development experience
  ...(process.env.NODE_ENV === 'development' && {
    onDemandEntries: {
      // Keep pages in memory for 60 seconds instead of default 25 seconds
      maxInactiveAge: 60 * 1000,
      // Keep at most 5 pages in memory at a time
      pagesBufferLength: 5,
    }
  }),
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'corporate-agent-frontend.vercel.app',
      },
      {
        protocol: 'https',
        hostname: 'api.echanneling.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.echanneling.com',
      }
    ],
  },
  typescript: {
    ignoreBuildErrors: process.env.VERCEL_ENV === 'production',
  },
  eslint: {
    ignoreDuringBuilds: process.env.VERCEL_ENV === 'production',
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
  
  // CSS configuration for better build compatibility
  webpack: (config, { dev, isServer }) => {
    // Fix CSS handling on build
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups.default = {
        minChunks: 2,
        priority: -20,
        reuseExistingChunk: true,
      }
    }
    
    return config
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig