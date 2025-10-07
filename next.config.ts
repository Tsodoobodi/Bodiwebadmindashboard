// next.config.ts
import type { NextConfig } from 'next';

const config: NextConfig = {
  // ⭐⭐⭐ STATIC EXPORT - ЧУХАЛ! ⭐⭐⭐
  output: 'export',
  
  // Image optimization идэвхгүй болгох
  images: {
    unoptimized: true,
    remotePatterns: [
      // Production backend
      {
        protocol: 'https',
        hostname: 'bodi-backend-api.azurewebsites.net',
        pathname: '/uploads/**',
      },
      // YouTube thumbnails
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/vi/**',
      },
      // Development backend
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5001',
        pathname: '/uploads/**',
      },
    ],
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://bodi-backend-api.azurewebsites.net',
  },
  
  // Trailing slash
  trailingSlash: true,
};

export default config;