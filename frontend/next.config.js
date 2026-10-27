/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@invoice/types', '@invoice/validation'],
  
  // Output standalone cho Docker deployment (optional)
  output: 'standalone',
  
  // Vercel deployment
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

module.exports = nextConfig;
