// Search API — dinamik icerik (blog + hisse). Statik veri
// (araclar, endeksler, doviz, altin) client-side bundle'da aranir,
// bu endpoint sadece DB/API verileri icin.

import { NextRequest, NextResponse } from 'next/server';

const API_BASE: string =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const q: string = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) {
    return NextResponse.json({ blog: [] as unknown[], stocks: [] as unknown[] });
  }

  const limit: number = 10;

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

  const stocksPromise: Promise<unknown[]> = fetch(
    API_BASE + '/api/tools/stocks?search=' + encodeURIComponent(q),
    { next: { revalidate: 300 } },
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

  const [blog, stocks] = await Promise.all([blogPromise, stocksPromise]);

  return NextResponse.json({
    blog: (blog as unknown[]).slice(0, limit),
    stocks: (stocks as unknown[]).slice(0, limit),
  });
}
