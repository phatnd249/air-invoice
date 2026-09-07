/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@invoice/types', '@invoice/validation'],
};

module.exports = nextConfig;
