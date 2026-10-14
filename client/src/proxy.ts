import { NextResponse, type NextRequest } from 'next/server';
import { PROTECTED_ROUTES, AUTH_ROUTES, ADMIN_ROUTES } from '@/lib/constants';
import { BORSA_ENABLED } from '@/lib/features';
import { verifySession } from '@/lib/server-session';

// Yapay zekâ tarayıcı/asistanları. *-User ve OAI-SearchBot/PerplexityBot istekleri, bir kullanıcının
// sorusu yanıtlanırken sayfanın okunduğunu gösterir (GEO görünürlüğünün doğrudan işareti).
// Kayıt stdout'a tek satır JSON olarak düşer; hermes GEO görevi `docker logs` ile sayar.
const AI_BOTS: [RegExp, string][] = [
  [/ChatGPT-User/i, 'ChatGPT-User'],
  [/OAI-SearchBot/i, 'OAI-SearchBot'],
  [/GPTBot/i, 'GPTBot'],
  [/Perplexity-User/i, 'Perplexity-User'],
  [/PerplexityBot/i, 'PerplexityBot'],
  [/Claude-User/i, 'Claude-User'],
  [/Claude-SearchBot/i, 'Claude-SearchBot'],
  [/ClaudeBot/i, 'ClaudeBot'],
  [/Google-Extended|Google-CloudVertexBot/i, 'Google-AI'],
  [/Gemini-Deep-Research/i, 'Gemini-DeepResearch'],
  [/meta-externalagent|meta-externalfetcher/i, 'Meta-AI'],
  [/Applebot-Extended/i, 'Applebot-Extended'],
  [/Bytespider/i, 'Bytespider'],
  [/CCBot/i, 'CCBot'],
  [/DuckAssistBot/i, 'DuckAssistBot'],
  [/MistralAI-User/i, 'MistralAI-User'],
  [/YouBot/i, 'YouBot'],
];

// Arama motoru tarayıcıları: hangi motorun siteyi ne sıklıkla taradığı (dizine alınma göstergesi).
// Aynı JSON satırına t:'search-bot' ile yazılır; SEO raporu sayar.
const SEARCH_BOTS: [RegExp, string][] = [
  [/Googlebot-Image/i, 'Googlebot-Image'],
  [/Googlebot/i, 'Googlebot'],
  [/bingbot/i, 'Bingbot'],
  [/YandexBot|YandexMobileBot/i, 'YandexBot'],
  [/Applebot(?!-Extended)/i, 'Applebot'],
  [/DuckDuckBot/i, 'DuckDuckBot'],
  [/PetalBot/i, 'PetalBot'],
  [/SeznamBot/i, 'SeznamBot'],
  [/Baiduspider/i, 'Baiduspider'],
];

function logAiBot(request: NextRequest) {
  const ua = request.headers.get('user-agent') || '';
  const hit = AI_BOTS.find(([re]) => re.test(ua));
  if (hit) {
    console.log(JSON.stringify({ t: 'ai-bot', bot: hit[1], path: request.nextUrl.pathname, ts: new Date().toISOString() }));
    return;
  }
  const se = SEARCH_BOTS.find(([re]) => re.test(ua));
  if (se) console.log(JSON.stringify({ t: 'search-bot', bot: se[1], path: request.nextUrl.pathname, ts: new Date().toISOString() }));
}

// Kaldırılan /borsa sayfalarına gelen ziyaretçiye (veri göstermeyen) hisse araçları önerilir
const BORSA_GONE_LINKS: [string, string][] = [
  ['/araclar/hisse-kar-zarar-hesaplama', 'Hisse kâr/zarar hesaplama'],
  ['/araclar/ortalama-maliyet-hesaplama', 'Hisse ortalama maliyet hesaplama'],
  ['/araclar/temettu-hesaplama', 'Temettü hesaplama'],
  ['/araclar/fk-orani-hesaplama', 'F/K ve PD/DD hesaplama'],
  ['/araclar/sermaye-temettu', 'Bedelli/bedelsiz sermaye artırımı'],
  ['/blog', 'Yatırım rehberleri'],
];

const AUTH_SCOPE = ['/hesabim', '/admin', '/giris', '/kayit', '/sifremi-unuttum'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  logAiBot(request);

  // Borsa İstanbul verisi yayından kaldırıldı: /borsa altı kalıcı olarak 410 Gone
  if (!BORSA_ENABLED && (pathname === '/borsa' || pathname.startsWith('/borsa/'))) {
    return new NextResponse(
      '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Sayfa kaldırıldı</title></head>' +
        '<body style="font-family:system-ui,sans-serif;max-width:560px;margin:15vh auto;padding:0 16px;text-align:center">' +
        '<h1>Bu sayfa kaldırıldı</h1><p>Borsa bölümü artık yayında değil. Hisse işlemleriniz için hesaplama araçlarımızı kullanabilirsiniz:</p>' +
        '<ul style="list-style:none;padding:0;line-height:2">' +
        BORSA_GONE_LINKS.map(([href, label]) => `<li><a href="${href}">${label}</a></li>`).join('') +
        '</ul><p><a href="/">Ana sayfaya dön</a></p></body></html>',
      { status: 410, headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex', 'Cache-Control': 'public, max-age=3600' } },
    );
  }
  if (!AUTH_SCOPE.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return NextResponse.next();

  const session = await verifySession(request);
  const finish = (response: NextResponse) => {
    for (const cookie of session.cookies) response.headers.append('Set-Cookie', cookie);
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  };

  const isProtectedRoute = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname === r);

  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && session.unavailable) {
    return finish(new NextResponse('Oturum şu anda doğrulanamıyor. Lütfen tekrar deneyin.', { status: 503 }));
  }
  if (isProtectedRoute && !session.user) {
    const loginUrl = new URL('/giris', request.url);
    loginUrl.searchParams.set('from', pathname);
    return finish(NextResponse.redirect(loginUrl));
  }

  // Redirect to home if accessing admin route without admin role
  if (isAdminRoute && session.user?.role !== 'admin') {
    return finish(NextResponse.redirect(new URL('/', request.url)));
  }

  // Redirect to home if accessing auth routes while logged in
  if (isAuthRoute && session.user) {
    return finish(NextResponse.redirect(new URL('/', request.url)));
  }

  return finish(NextResponse.next());
}

export const config = {
  // Statik dosyalar hariç tüm sayfalar (bot kaydı için); oturum kuralları AUTH_SCOPE ile sınırlı
  matcher: ['/((?!_next/|favicon|icon\\.svg|apple-touch|android-chrome|atlas/|og-default|site\\.webmanifest).*)'],
};
