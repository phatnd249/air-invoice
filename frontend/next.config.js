/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Không gửi header X-Powered-By
  poweredByHeader: false,
  transpilePackages: ['@invoice/types', '@invoice/validation'],
  
  // Output standalone cho Docker deployment (optional)
  output: 'standalone',
  
  // Vercel deployment
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // Security headers cho toàn bộ frontend
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
        ],
      },
    ];
  },

  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://invoice-backend-5tbi.onrender.com';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl.replace(/\/+$/, '')}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
