import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://finanscozum.net';

  const staticPages = [
    '', '/altin', '/borsa', '/borsa/hisseler', '/blog', '/araclar',
    '/araclar/kredi-hesaplama', '/araclar/vergi-hesaplama', '/araclar/mevduat-getiri',
    '/araclar/doviz-cevirici', '/araclar/enflasyon-hesaplama', '/araclar/altin-cevirici',
    '/araclar/kredi-karti-minimum', '/araclar/bilesik-faiz',
    '/giris', '/kayit',
  ];

  return staticPages.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' || path === '/altin' || path === '/borsa' ? 'hourly' : 'weekly',
    priority: path === '' ? 1 : path.startsWith('/araclar/') ? 0.7 : 0.8,
  }));
}
