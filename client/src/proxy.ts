import { NextResponse, type NextRequest } from 'next/server';
import { PROTECTED_ROUTES, AUTH_ROUTES, ADMIN_ROUTES } from '@/lib/constants';

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

function logAiBot(request: NextRequest) {
  const ua = request.headers.get('user-agent') || '';
  const hit = AI_BOTS.find(([re]) => re.test(ua));
  if (hit) console.log(JSON.stringify({ t: 'ai-bot', bot: hit[1], path: request.nextUrl.pathname, ts: new Date().toISOString() }));
}

const AUTH_SCOPE = ['/hesabim', '/admin', '/giris', '/kayit', '/sifremi-unuttum'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  logAiBot(request);
  if (!AUTH_SCOPE.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return NextResponse.next();

  // Check if user has auth token in cookies (set by client-side auth flow)
  const token = request.cookies.get('finanscozum-token')?.value;
  const userRole = request.cookies.get('finanscozum-role')?.value;

  const isProtectedRoute = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname === r);

  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/giris', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to home if accessing admin route without admin role
  if (isAdminRoute && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirect to home if accessing auth routes while logged in
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Statik dosyalar hariç tüm sayfalar (bot kaydı için); oturum kuralları AUTH_SCOPE ile sınırlı
  matcher: ['/((?!_next/|favicon|icon\\.svg|apple-touch|android-chrome|atlas/|og-default|site\\.webmanifest).*)'],
};
