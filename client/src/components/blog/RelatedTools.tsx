'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { TOOL_META } from '@/lib/seo-data/tools';

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
  const total = Object.keys(TOOL_META).length;

  return (
    <section className="atlas-card mt-10 p-5 sm:p-6" aria-labelledby="related-tools-heading">
      <p className="eyebrow text-primary">Hesaplama araçları</p>
      <h2 id="related-tools-heading" className="font-display mt-2 text-2xl text-foreground">
        Bu konuda hemen hesaplayın
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Yazıdaki kavramları ücretsiz araçlarla deneyin; üyelik gerekmez.</p>

      <ul className="mt-5 divide-y divide-border/70 border-y border-border">
        {tools.map((tool) => (
          <li key={tool.href}>
            <Link href={tool.href} className="group flex items-center gap-4 py-3.5">
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium text-foreground group-hover:text-primary">{tool.title}</span>
                <span className="block text-[13px] text-muted-foreground">{tool.description}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>

      <Link href="/araclar" className="group mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
        Tüm {total} aracı gör
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </Link>
    </section>
  );
}
