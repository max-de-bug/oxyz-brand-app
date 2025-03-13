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
  images: {
    domains: ["cdn.discordapp.com", "res.cloudinary.com"],
  },
  // Enable standalone output for Docker deployment
  output: "standalone",
  // Add any other configurations here
};

module.exports = nextConfig;
