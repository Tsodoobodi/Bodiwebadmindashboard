// next.config.ts
import type { NextConfig } from 'next';

const config: NextConfig = {
  // ⭐ STATIC EXPORT
  output: 'export',
  
  // ✅ Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // ✅ Image optimization
  images: {
    unoptimized: true,
    formats: ['image/webp'],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bodi-web-backend-bzf7bnh6csbvf0cp.eastasia-01.azurewebsites.net',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/vi/**',
      },
    ],
  },
  
  // ✅ Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://bodi-web-backend-bzf7bnh6csbvf0cp.eastasia-01.azurewebsites.net',
  },
  
  // ✅ Trailing slash
  trailingSlash: true,
  
  // ✅ Production optimizations
  productionBrowserSourceMaps: false, // Source maps үүсгэхгүй (bundle багасна)
  poweredByHeader: false, // Security header
  compress: true, // Gzip compression
};

export default config;