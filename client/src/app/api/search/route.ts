import { API_URL } from '@/lib/constants';
// Search API route — dinamik icerik (blog + hisse + endeks).
// Statik veri (araçlar, endeksler, döviz, altın) client-side bundle'da
// aranıyor, bu endpoint sadece DB/API verileri için.

import { NextRequest, NextResponse } from 'next/server';

const API_BASE: string =
  API_URL;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const q: string = (req.nextUrl.searchParams.get('q')?.trim() ?? '').slice(0, 100);
  if (q.length < 2) {
    return NextResponse.json({
      blog: [] as unknown[],
      stocks: [] as unknown[],
      indices: [] as unknown[],
    });
  }

  const limit: number = 15;

  const blogPromise: Promise<unknown[]> = fetch(
    API_BASE + '/api/blogs?limit=' + limit + '&search=' + encodeURIComponent(q),
    { next: { revalidate: 60 } },
  )
    .then((r) => (r.ok ? r.json() : { data: [] }))
    .then((d: unknown): unknown[] => {
      if (Array.isArray(d)) return d;
      if (d && typeof d === 'object' && 'data' in d && Array.isArray((d as { data: unknown }).data)) {
        return (d as { data: unknown[] }).data;
      }
      return [];
    })
    .catch(() => []);

  // Backend proxy — stocks cache'i (5dk TTL) üzerinden.
  const stocksPromise: Promise<unknown[]> = fetch(
    API_BASE + '/api/market/stocks/search?q=' + encodeURIComponent(q),
    { next: { revalidate: 300 } },
  )
    .then((r) => (r.ok ? r.json() : { data: [] }))
    .then((d: unknown): unknown[] => {
      if (d && typeof d === 'object' && 'data' in d && Array.isArray((d as { data: unknown }).data)) {
        return (d as { data: unknown[] }).data;
      }
      return [];
    })
    .catch(() => []);

  // Backend proxy — indices cache'i.
  const indicesPromise: Promise<unknown[]> = fetch(
    API_BASE + '/api/market/indices/search?q=' + encodeURIComponent(q),
    { next: { revalidate: 300 } },
  )
    .then((r) => (r.ok ? r.json() : { data: [] }))
    .then((d: unknown): unknown[] => {
      if (d && typeof d === 'object' && 'data' in d && Array.isArray((d as { data: unknown }).data)) {
        return (d as { data: unknown[] }).data;
      }
      return [];
    })
    .catch(() => []);

  const [blog, stocks, indices] = await Promise.all([
    blogPromise,
    stocksPromise,
    indicesPromise,
  ]);

  return NextResponse.json({
    blog: (blog as unknown[]).slice(0, limit),
    stocks: (stocks as unknown[]).slice(0, limit),
    indices: (indices as unknown[]).slice(0, limit),
  });
}
