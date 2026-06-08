'use client';

import Link from 'next/link';
import { Calculator, TrendingUp, ArrowRight } from 'lucide-react';

interface Tool {
  title: string;
  description: string;
  href: string;
  icon: string; // emoji
}

interface Props {
  category?: string | undefined;
  slug: string;
}

// Kategori → araç önerileri haritası
// Her blog yazısının sonunda konuyla ilgili 3-4 hesaplama aracı gösterilir
const TOOLS_BY_CATEGORY: Record<string, Tool[]> = {
  kredi: [
    { title: 'İhtiyaç Kredisi Hesaplama', description: 'Aylık taksit ve toplam maliyet', href: '/araclar/ihtiyac-kredisi', icon: '💳' },
    { title: 'Konut Kredisi Hesaplama', description: 'Ev kredisi taksit planı', href: '/araclar/konut-kredisi', icon: '🏠' },
    { title: 'Kredi Yıllık Maliyet Oranı', description: 'Gerçek faiz yükü hesabı', href: '/araclar/kredi-yillik-maliyet-orani', icon: '📊' },
  ],
  emeklilik: [
    { title: 'Bireysel Emeklilik Hesaplama', description: 'BES birikim projeksiyonu', href: '/araclar/birikim-hesaplama', icon: '🏦' },
    { title: 'Reel Getiri Hesaplama', description: 'Enflasyondan arındırılmış getiri', href: '/araclar/reel-getiri', icon: '📈' },
    { title: 'Bileşik Faiz Hesaplama', description: 'Uzun vadeli birikim gücü', href: '/araclar/bilesik-buyume', icon: '🧮' },
  ],
  borsa: [
    { title: 'BIST 100 Anlık', description: 'Endeks ve hisse verileri', href: '/borsa?tab=hisseler', icon: '📊' },
    { title: 'Net Bugünkü Değer', description: 'Hisse değerleme NPV', href: '/araclar/net-bugunku-deger', icon: '💹' },
    { title: 'İç Verim Oranı (IRR)', description: 'Yatırım getiri analizi', href: '/araclar/ic-verim-orani', icon: '📈' },
  ],
  altin: [
    { title: 'Altın Çeviri Hesaplama', description: 'Gram altın, çeyrek, ons', href: '/araclar/altin-hesaplama', icon: '🪙' },
    { title: 'Geçmiş Altın Fiyatları', description: 'Tarihsel altın verileri', href: '/araclar/gecmis-altin-fiyatlari', icon: '📜' },
    { title: 'Reel Getiri', description: 'Altının reel getirisi', href: '/araclar/reel-getiri', icon: '💰' },
  ],
  doviz: [
    { title: 'Döviz Çeviri', description: 'TL, USD, EUR, GBP çevirici', href: '/araclar/doviz-hesaplama', icon: '💱' },
    { title: 'Geçmiş Döviz Kurları', description: 'Tarihsel kur verileri', href: '/araclar/gecmis-doviz-kurlari', icon: '📅' },
    { title: 'Enflasyon Hesaplama', description: 'Parasal değer kaybı', href: '/araclar/enflasyon-hesaplama', icon: '📉' },
  ],
  faiz: [
    { title: 'Faiz Hesaplama', description: 'Basit/bileşik faiz', href: '/araclar/faiz-hesaplama', icon: '🧮' },
    { title: 'Bileşik Büyüme', description: 'Yıllık bileşik getiri', href: '/araclar/bilesik-buyume', icon: '📈' },
    { title: 'Vadeli Mevduat', description: 'Mevduat faizi karşılaştır', href: '/araclar/vadeli-mevduat', icon: '🏦' },
  ],
};

// Slug'a göre de otomatik tahmin (içerik anahtar kelimesine göre)
function detectCategory(slug: string, declaredCategory?: string): string {
  if (declaredCategory && TOOLS_BY_CATEGORY[declaredCategory]) {
    return declaredCategory;
  }
  const s = slug.toLowerCase();
  if (s.includes('kredi') || s.includes('ihtiyac') || s.includes('konut') || s.includes('tasit')) return 'kredi';
  if (s.includes('bes') || s.includes('emeklilik')) return 'emeklilik';
  if (s.includes('hisse') || s.includes('borsa') || s.includes('temettu') || s.includes('sermaye')) return 'borsa';
  if (s.includes('altin') || s.includes('ons') || s.includes('gumus') || s.includes('bilezik')) return 'altin';
  if (s.includes('doviz') || s.includes('dolar') || s.includes('euro') || s.includes('kur')) return 'doviz';
  if (s.includes('faiz') || s.includes('mevduat') || s.includes('repo') || s.includes('bono')) return 'faiz';
  return 'kredi'; // Default
}

export function RelatedTools({ category, slug }: Props) {
  const cat = detectCategory(slug, category);
  const tools = TOOLS_BY_CATEGORY[cat] || TOOLS_BY_CATEGORY.kredi;

  return (
    <section
      className="mt-10 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-6"
      aria-labelledby="related-tools-heading"
    >
      <div className="mb-4 flex items-center gap-2">
        <Calculator className="h-5 w-5 text-primary" />
        <h2 id="related-tools-heading" className="text-lg font-bold">
          Bu Konuda Hemen Hesap Yapın
        </h2>
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        Yazıdaki kavramları pratik araçlarla deneyimleyin. Tüm hesaplamalar ücretsiz ve reklamsız.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm"
          >
            <span className="text-2xl flex-shrink-0" aria-hidden>
              {tool.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm group-hover:text-primary transition-colors">
                {tool.title}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                {tool.description}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
          </Link>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between text-xs">
        <p className="text-muted-foreground">
          <TrendingUp className="inline h-3 w-3 mr-1" />
          {tools.length} ilgili araç
        </p>
        <Link
          href="/araclar"
          className="font-semibold text-primary hover:underline"
        >
          Tüm 42 aracı gör →
        </Link>
      </div>
    </section>
  );
}
