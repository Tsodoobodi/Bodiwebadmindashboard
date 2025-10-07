// next.config.ts
import type { NextConfig } from 'next';

const config: NextConfig = {
  // Static Export for Azure Static Web Apps
  output: 'export',
  
  // Disable image optimization for static export
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bodi-backend-api.azurewebsites.net',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/vi/**',
      },
      // Development
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
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  
  // Trailing slash for better static hosting
  trailingSlash: true,
};

export default config;