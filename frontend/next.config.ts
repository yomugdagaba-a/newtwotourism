import type { NextConfig } from "next";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://tourismsystem.onrender.com';

const nextConfig: NextConfig = {
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${BACKEND_URL}/uploads/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9001",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "localhost",
        port: "9001",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.wikimedia.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.pexels.com",
        pathname: "/**",
      },
      // Adobe Stock / Fotolia
      {
        protocol: "https",
        hostname: "**.ftcdn.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.adobe.com",
        pathname: "/**",
      },
      // Shutterstock
      {
        protocol: "https",
        hostname: "**.shutterstock.com",
        pathname: "/**",
      },
      // iStock
      {
        protocol: "https",
        hostname: "**.istockphoto.com",
        pathname: "/**",
      },
      // Getty Images
      {
        protocol: "https",
        hostname: "**.gettyimages.com",
        pathname: "/**",
      },
      // Pixabay
      {
        protocol: "https",
        hostname: "**.pixabay.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.pixabay.com",
        pathname: "/**",
      },
      // Imgur
      {
        protocol: "https",
        hostname: "**.imgur.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.imgur.com",
        pathname: "/**",
      },
      // Google user content
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
        pathname: "/**",
      },
      // AWS S3
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
        pathname: "/**",
      },
      // Firebase Storage
      {
        protocol: "https",
        hostname: "**.firebasestorage.googleapis.com",
        pathname: "/**",
      },
      // Generic image CDNs
      {
        protocol: "https",
        hostname: "**.imgix.net",
        pathname: "/**",
      },
      // Allow any HTTPS image (fallback - less secure but flexible)
      {
        protocol: "https",
        hostname: "**",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
