import type { MetadataRoute } from 'next';

// robots.txt — iki user-agent'ta aynı disallow listesi tutarlı olmalı.
// Önceki sürümde Googlebot için /giris, /kayit, /sifremi-unuttum
// eksikti (Pit 25 benzeri tutarsızlık). Şimdi her iki kural aynı.
const DISALLOW = ['/admin/', '/hesabim/', '/api/', '/giris', '/kayit', '/sifremi-unuttum'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: DISALLOW,
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: DISALLOW,
      },
    ],
    sitemap: 'https://finanscozum.net/sitemap.xml',
  };
}
