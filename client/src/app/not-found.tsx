import type { Metadata } from 'next';
import Link from 'next/link';
import { Home, Search, TrendingUp, Calculator, BookOpen, ArrowRight } from 'lucide-react';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { BORSA_ENABLED } from '@/lib/features';

export const metadata: Metadata = {
  title: 'Sayfa Bulunamadı (404)',
  description: 'Aradığınız sayfa bulunamadı. Ancak FinansÇözüm\'de altın, döviz ve 100+ finansal hesaplama aracı sizleri bekliyor.',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  alternates: {
    canonical: `${SITE_URL}/404`,
  },
};

// 404 sayfası Google index'ine GİRMEZ (noindex,nofollow)
// Ancak 5 dakika boyunca 404 response korunur, sonra Next.js soft-404 yapabilir
export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full text-center">
        <p className="text-7xl font-extrabold text-primary mb-2">404</p>
        <h1 className="font-display text-balance text-4xl text-foreground sm:text-5xl mb-3">Sayfa Bulunamadı</h1>
        <p className="text-muted-foreground mb-8">
          Aradığınız sayfa burada yok ama <strong>{SITE_NAME}</strong>'da Türkiye'nin en
          kapsamlı finans verileri sizleri bekliyor. Aşağıdaki bölümlere göz atabilirsiniz.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-left">
          <Link
            href="/"
            className="flex items-center gap-3 atlas-card p-4 transition-colors hover:border-primary"
          >
            <Home className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">Ana Sayfa</p>
              <p className="text-xs text-muted-foreground">Tüm veriler tek bakışta</p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </Link>
          {BORSA_ENABLED && (
            <Link
              href="/borsa"
              className="flex items-center gap-3 atlas-card p-4 transition-colors hover:border-primary"
            >
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Borsa & Endeksler</p>
                <p className="text-xs text-muted-foreground">60+ hisse, BIST 100/30</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </Link>
          )}
          <Link
            href="/altin"
            className="flex items-center gap-3 atlas-card p-4 transition-colors hover:border-primary"
          >
            <span className="text-primary text-lg">₺</span>
            <div>
              <p className="font-semibold">Altın Fiyatları</p>
              <p className="text-xs text-muted-foreground">Gram, çeyrek, tam, ons</p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </Link>
          <Link
            href="/doviz"
            className="flex items-center gap-3 atlas-card p-4 transition-colors hover:border-primary"
          >
            <span className="text-primary text-lg">$</span>
            <div>
              <p className="font-semibold">Döviz Kurları</p>
              <p className="text-xs text-muted-foreground">Dolar, Euro, Sterlin...</p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </Link>
          <Link
            href="/araclar"
            className="flex items-center gap-3 atlas-card p-4 transition-colors hover:border-primary"
          >
            <Calculator className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">Hesaplama Araçları</p>
              <p className="text-xs text-muted-foreground">42 ücretsiz araç</p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </Link>
          <Link
            href="/blog"
            className="flex items-center gap-3 atlas-card p-4 transition-colors hover:border-primary"
          >
            <BookOpen className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">Finans Blog</p>
              <p className="text-xs text-muted-foreground">Rehberler, analizler</p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </Link>
        </div>

        <form
          action="/blog"
          method="get"
          className="flex items-center gap-2 max-w-md mx-auto"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              name="q"
              placeholder="Blog yazılarında ara..."
              className="w-full pl-10 pr-3 py-2 atlas-card text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Ara
          </button>
        </form>
      </div>
    </div>
  );
}
