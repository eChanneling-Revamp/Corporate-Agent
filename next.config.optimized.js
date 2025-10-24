/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  // React strict mode for better development
  reactStrictMode: true,
  
  // Enable SWC minification for better performance
  swcMinify: true,
  
  // Image optimization
  images: {
    domains: [
      'localhost',
      'api.yourdomain.com',
      'cdn.yourdomain.com',
      'images.unsplash.com',
      'i.imgur.com'
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
  },
  
  // Compression
  compress: true,
  
  // Production optimizations
  productionBrowserSourceMaps: false,
  
  // Webpack configuration
  webpack: (config, { dev, isServer, webpack }) => {
    // Optimization for production
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          minChunks: 1,
          maxAsyncRequests: 30,
          maxInitialRequests: 30,
          cacheGroups: {
            // Vendor chunk
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name(module) {
                const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1]
                return `npm.${packageName.replace('@', '')}`
              },
              priority: 10,
              reuseExistingChunk: true,
            },
            // React/React-DOM chunk
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-redux|redux)[\\/]/,
              name: 'react',
              priority: 20,
              reuseExistingChunk: true,
            },
            // UI components chunk
            ui: {
              test: /[\\/]components[\\/]/,
              name: 'ui',
              priority: 5,
              reuseExistingChunk: true,
            },
            // Common chunk
            common: {
              minChunks: 2,
              priority: -10,
              reuseExistingChunk: true,
            },
            // Default chunk
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
          },
        },
        // Tree shaking
        usedExports: true,
        // Module concatenation
        concatenateModules: true,
        // Remove duplicate modules
        removeAvailableModules: true,
        removeEmptyChunks: true,
        mergeDuplicateChunks: true,
      }
    }
    
    // Ignore certain modules to reduce bundle size
    config.resolve.alias = {
      ...config.resolve.alias,
      // Use preact in production for smaller bundle
      ...(process.env.NODE_ENV === 'production' && !isServer
        ? {
            'react/jsx-runtime.js': 'preact/compat/jsx-runtime',
            'react-dom': 'preact/compat',
            'react': 'preact/compat',
          }
        : {}),
    }
    
    // Module replacements for smaller alternatives
    config.resolve.alias = {
      ...config.resolve.alias,
      // Replace moment with date-fns (already using date-fns)
      'moment': 'date-fns',
      // Replace lodash with lodash-es for tree shaking
      'lodash': 'lodash-es',
    }
    
    // Ignore specific modules
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
      })
    )
    
    // Add module federation for micro-frontends (if needed)
    if (!isServer) {
      config.plugins.push(
        new webpack.container.ModuleFederationPlugin({
          name: 'corporateAgent',
          filename: 'remoteEntry.js',
          exposes: {
            './Header': './components/layout/Header',
            './Footer': './components/layout/Footer',
            './Dashboard': './components/dashboard/MainDashboard',
          },
          shared: {
            react: { singleton: true, requiredVersion: '^18.0.0' },
            'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
          },
        })
      )
    }
    
    // Custom webpack rules
    config.module.rules.push({
      test: /\.(graphql|gql)$/,
      exclude: /node_modules/,
      loader: 'graphql-tag/loader',
    })
    
    return config
  },
  
  // Experimental features
  experimental: {
    // Enable server components
    serverComponents: true,
    // Optimize CSS
    optimizeCss: true,
    // Optimize fonts
    optimizeFonts: true,
    // Partial prerendering
    ppr: true,
    // Typed routes
    typedRoutes: true,
  },
  
  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      // Cache static assets
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache images
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/signin',
        destination: '/auth/login',
        permanent: true,
      },
      {
        source: '/signup',
        destination: '/auth/register',
        permanent: true,
      },
    ]
  },
  
  // Rewrites for API proxy
  async rewrites() {
    return {
      beforeFiles: [
        // Rewrite for service worker
        {
          source: '/sw.js',
          destination: '/_next/static/sw.js',
        },
      ],
      afterFiles: [
        // API proxy in development
        ...(process.env.NODE_ENV === 'development'
          ? [
              {
                source: '/api/:path*',
                destination: 'http://localhost:3001/api/:path*',
              },
            ]
          : []),
      ],
      fallback: [],
    }
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_APP_NAME: 'eChanneling Corporate Agent',
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version,
  },
  
  // TypeScript
  typescript: {
    // Ignore TypeScript errors in production build
    ignoreBuildErrors: process.env.IGNORE_BUILD_ERRORS === 'true',
  },
  
  // ESLint
  eslint: {
    // Ignore ESLint errors in production build
    ignoreDuringBuilds: process.env.IGNORE_LINT_ERRORS === 'true',
    dirs: ['pages', 'components', 'lib', 'hooks', 'utils', 'services'],
  },
  
  // Output configuration
  output: 'standalone',
  
  // Trailing slash
  trailingSlash: false,
  
  // Power by header
  poweredByHeader: false,
  
  // Generate build ID
  generateBuildId: async () => {
    return process.env.BUILD_ID || `build-${Date.now()}`
  },
  
  // Dev indicators
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },
  
  // Page extensions
  pageExtensions: ['tsx', 'ts', 'jsx', 'js', 'mdx', 'md'],
  
  // Compiler options
  compiler: {
    // Remove console in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
    // React remove properties
    reactRemoveProperties: process.env.NODE_ENV === 'production',
    // Styled components
    styledComponents: true,
    // Emotion
    emotion: true,
  },
}

// Export with bundle analyzer
module.exports = withBundleAnalyzer(nextConfig)
