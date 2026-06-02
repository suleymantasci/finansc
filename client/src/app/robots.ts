import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/hesabim/', '/api/', '/giris', '/kayit', '/sifremi-unuttum'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/', '/hesabim/', '/api/'],
      },
    ],
    sitemap: 'https://finanscozum.net/sitemap.xml',
  };
}
