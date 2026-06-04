import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    // Modern format desteği (CWV skoru için kritik)
    formats: ['image/avif', 'image/webp'],
    // Cihaz boyutlarına göre otomatik responsive
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Blog thumbnail'ları Unsplash'ten geliyor
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
        pathname: '/**',
      },
    ],
    // Minimum cache TTL — yeni build sonrası eski versiyonun stale kullanımı için
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 gün
  },
  async rewrites() {
    return [
      {
        source: '/api/:path+',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/:path+`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/blog/:slug+',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/araclar/:slug+',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/altin',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=15, stale-while-revalidate=30' },
        ],
      },
      {
        source: '/borsa/:path+',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=15, stale-while-revalidate=30' },
        ],
      },
      {
        source: '/doviz',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=15, stale-while-revalidate=30' },
        ],
      },
      // Favicon ve OG image uzun cache — her dosya için ayrı kural
      // (path-to-regexp alternation + modifier çakışması nedeniyle ayrı ayrı)
      { source: '/favicon.ico', headers: [{ key: 'Cache-Control', value: 'public, s-maxage=31536000, immutable' }] },
      { source: '/favicon-16x16.png', headers: [{ key: 'Cache-Control', value: 'public, s-maxage=31536000, immutable' }] },
      { source: '/favicon-32x32.png', headers: [{ key: 'Cache-Control', value: 'public, s-maxage=31536000, immutable' }] },
      { source: '/favicon-32x32.webp', headers: [{ key: 'Cache-Control', value: 'public, s-maxage=31536000, immutable' }] },
      { source: '/apple-touch-icon.png', headers: [{ key: 'Cache-Control', value: 'public, s-maxage=31536000, immutable' }] },
      { source: '/android-chrome-192x192.png', headers: [{ key: 'Cache-Control', value: 'public, s-maxage=31536000, immutable' }] },
      { source: '/android-chrome-192x192.webp', headers: [{ key: 'Cache-Control', value: 'public, s-maxage=31536000, immutable' }] },
      { source: '/android-chrome-512x512.png', headers: [{ key: 'Cache-Control', value: 'public, s-maxage=31536000, immutable' }] },
      { source: '/og-default.png', headers: [{ key: 'Cache-Control', value: 'public, s-maxage=31536000, immutable' }] },
      { source: '/logo.png', headers: [{ key: 'Cache-Control', value: 'public, s-maxage=31536000, immutable' }] },
      { source: '/site.webmanifest', headers: [{ key: 'Cache-Control', value: 'public, s-maxage=31536000, immutable' }] },
    ];
  },
};

export default nextConfig;
