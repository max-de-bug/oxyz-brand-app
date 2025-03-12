/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during production builds
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript type checking during builds
  typescript: {
    ignoreBuildErrors: true,
  },
  // Add any other configurations here
};

module.exports = nextConfig;
