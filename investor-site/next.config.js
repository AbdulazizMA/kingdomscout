/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.aqar.fm' },
      { protocol: 'https', hostname: '*.bayut.sa' },
      { protocol: 'https', hostname: 'haraj.com.sa' },
    ],
  },
};

module.exports = nextConfig;
