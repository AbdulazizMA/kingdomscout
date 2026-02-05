/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**.aqar.fm' },
      { protocol: 'https', hostname: 'images.aqar.fm' },
      { protocol: 'https', hostname: '**.bayut.sa' },
      { protocol: 'https', hostname: '**.bayut.com' },
      { protocol: 'https', hostname: '**.haraj.com.sa' },
      { protocol: 'https', hostname: '**.railway.app' },
      { protocol: 'https', hostname: '**.onrender.com' },
    ],
  },
};

module.exports = nextConfig;
