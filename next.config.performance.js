// Next.js performance optimizations
const nextConfig = {
  // Enable SWC minification (faster than Terser)
  swcMinify: true,

  // Enable experimental features for performance
  experimental: {
    // Enable React 18 concurrent features
    concurrentFeatures: true,
    
    // Enable server components (if using React 18)
    serverComponents: true,
    
    // Enable image optimization
    images: {
      allowFutureImage: true
    },

    // Enable output file tracing for smaller deployments
    outputFileTracingRoot: './',

    // Enable SWC plugins
    swcPlugins: [],
    
    // Enable ISR (Incremental Static Regeneration) improvements
    isrMemoryCacheSize: 50 * 1024 * 1024, // 50MB

    // Enable modularize imports for tree shaking
    modularizeImports: {
      lodash: {
        transform: 'lodash/{{member}}'
      },
      '@material-ui/icons': {
        transform: '@material-ui/icons/{{member}}'
      }
    }
  },

  // Webpack optimizations
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Production optimizations
    if (!dev) {
      // Enable webpack optimizations
      config.optimization = {
        ...config.optimization,
        
        // Split chunks for better caching
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            
            // Vendor chunk
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20
            },
            
            // Common chunk
            common: {
              name: 'common',
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
              enforce: true
            }
          }
        },

        // Tree shaking optimization
        usedExports: true,
        sideEffects: false,

        // Module concatenation
        concatenateModules: true,

        // Minimize bundle size
        minimize: true
      }

      // Bundle analyzer (uncomment to analyze bundle size)
      // config.plugins.push(new (require('webpack-bundle-analyzer').BundleAnalyzerPlugin)())
    }

    // Performance optimizations for both dev and prod
    config.module.rules.push(
      // Optimize images
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              publicPath: '/_next/static/images/',
              outputPath: 'static/images/'
            }
          },
          {
            loader: 'image-webpack-loader',
            options: {
              mozjpeg: {
                progressive: true,
                quality: 65
              },
              optipng: {
                enabled: false
              },
              pngquant: {
                quality: [0.65, 0.90],
                speed: 4
              },
              gifsicle: {
                interlaced: false
              },
              webp: {
                quality: 75
              }
            }
          }
        ]
      }
    )

    // Add performance hints
    config.performance = {
      maxAssetSize: 250000,
      maxEntrypointSize: 250000,
      hints: dev ? false : 'warning'
    }

    return config
  },

  // Image optimization
  images: {
    domains: [
      'localhost',
      'example.com' // Add your image domains
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },

  // Compression
  compress: true,

  // Headers for performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Security headers
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      },
      {
        source: '/api/(.*)',
        headers: [
          // API performance headers
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=600'
          }
        ]
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          // Static assets caching
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  },

  // Redirects and rewrites for performance
  async rewrites() {
    return [
      // API optimization rewrites
      {
        source: '/api/v1/:path*',
        destination: '/api/:path*'
      }
    ]
  },

  // Output configuration
  output: 'standalone',
  
  // Disable source maps in production for smaller bundles
  productionBrowserSourceMaps: false,

  // Enable static optimization
  trailingSlash: false,

  // PoweredBy header removal
  poweredByHeader: false,

  // React strict mode for development
  reactStrictMode: true,

  // ESLint configuration
  eslint: {
    dirs: ['pages', 'components', 'lib', 'hooks', 'utils']
  },

  // TypeScript configuration
  typescript: {
    tsconfigPath: './tsconfig.json'
  }
}

// Performance monitoring configuration
export const performanceConfig = {
  // API response time thresholds
  apiThresholds: {
    warning: 1000, // 1 second
    error: 5000    // 5 seconds
  },

  // Database query optimization
  database: {
    connectionPool: {
      min: 2,
      max: 10
    },
    queryTimeout: 30000,
    defaultLimit: 50,
    maxLimit: 1000
  },

  // Caching configuration
  cache: {
    defaultTTL: 300, // 5 minutes
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
    enableRedis: process.env.REDIS_URL !== undefined
  },

  // Client-side performance
  client: {
    enableServiceWorker: true,
    enableLazyLoading: true,
    imageOptimization: true,
    chunkSizeThreshold: 244 * 1024 // 244KB
  },

  // Monitoring
  monitoring: {
    enableMetrics: true,
    enableTracing: process.env.NODE_ENV === 'production',
    sampleRate: 0.1 // 10% sampling for tracing
  }
}

// Bundle size optimization tips
export const bundleOptimizationTips = {
  // Tree shaking improvements
  treeShaking: [
    'Use ES6 imports/exports',
    'Avoid default exports for utilities',
    'Use modularize-imports for large libraries',
    'Mark packages as side-effect free in package.json'
  ],

  // Code splitting strategies
  codeSplitting: [
    'Use dynamic imports for route-based splitting',
    'Implement component-based splitting for large components',
    'Split vendor libraries separately',
    'Use React.lazy() for heavy components'
  ],

  // Performance best practices
  bestPractices: [
    'Minimize bundle size with webpack-bundle-analyzer',
    'Use Next.js Image component for automatic optimization',
    'Implement proper caching strategies',
    'Use React.memo() for expensive components',
    'Implement virtual scrolling for large lists',
    'Use useMemo() and useCallback() appropriately',
    'Preload critical resources',
    'Minimize render-blocking resources'
  ]
}

// Performance monitoring utilities
export const performanceUtils = {
  // Measure component render time
  measureRenderTime: (componentName: string) => {
    const start = performance.now()
    return () => {
      const end = performance.now()
      console.log(`${componentName} render time: ${(end - start).toFixed(2)}ms`)
    }
  },

  // Measure API call time
  measureApiCall: async (apiCall: () => Promise<any>, endpoint: string) => {
    const start = performance.now()
    try {
      const result = await apiCall()
      const end = performance.now()
      const duration = end - start

      // Log slow API calls
      if (duration > performanceConfig.apiThresholds.warning) {
        console.warn(`Slow API call: ${endpoint} took ${duration.toFixed(2)}ms`)
      }

      return { result, duration }
    } catch (error) {
      const end = performance.now()
      const duration = end - start
      console.error(`API call failed: ${endpoint} after ${duration.toFixed(2)}ms`, error)
      throw error
    }
  },

  // Memory usage monitoring
  monitorMemoryUsage: () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
      }
    }
    return null
  },

  // Network performance monitoring
  monitorNetworkPerformance: () => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      }
    }
    return null
  }
}

module.exports = nextConfig