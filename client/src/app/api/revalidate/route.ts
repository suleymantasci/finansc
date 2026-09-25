import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { API_URL } from '@/lib/constants';

/**
 * Blog önbelleğini anında yeniler. Otomatik yazı akışı (hermes) yazı yayınlanınca ve kapak görseli
 * yüklenince çağırır; aksi hâlde sayfalar 5 dk'lık önbellek süresi dolana kadar eski/görselsiz kalıyordu.
 *
 * Yetki: istekteki yönetici JWT'si backend'in yalnız yöneticiye açık uç noktasıyla doğrulanır
 * (ayrı bir gizli anahtar tanımlamaya gerek yok).
 *
 * POST /api/revalidate  Authorization: Bearer <admin jwt>  body: { "slug": "yazi-slug" }  (slug isteğe bağlı)
 */
export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) {
    return NextResponse.json({ ok: false, error: 'yetkisiz' }, { status: 401 });
  }
  const check = await fetch(`${API_URL}/api/admin/stats`, {
    headers: { Authorization: auth },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  if (!check?.ok) {
    return NextResponse.json({ ok: false, error: 'yetkisiz' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { slug?: unknown };
  const slug = typeof body.slug === 'string' && /^[a-z0-9-]{1,200}$/.test(body.slug) ? body.slug : null;

  revalidateTag('blogs', { expire: 0 });
  revalidatePath('/blog');
  revalidatePath('/');
  if (slug) revalidatePath(`/blog/${slug}`);

  return NextResponse.json({ ok: true, revalidated: ['blogs', '/blog', '/', ...(slug ? [`/blog/${slug}`] : [])] });
}
