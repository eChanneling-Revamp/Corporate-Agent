/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  
  // Disable type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Disable ESLint during build  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  experimental: {},
  
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ignored: /node_modules/,
      }
    }
    return config
  },
  
  images: {
    domains: ['localhost'],
  },
  
  async redirects() {
    return []
  },
}

module.exports = nextConfig