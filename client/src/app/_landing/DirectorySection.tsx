import Link from 'next/link';
import { Plus } from 'lucide-react';
import { FAQSchema } from '@/components/seo/FAQSchema';
import { SectionHead } from './parts';

/**
 * Hızlı erişim dizini + SSS.
 * Dizin: tüm ana sayfalara tek tıkla iç link (tarama derinliği + bulunabilirlik).
 * SSS: AI arama motorlarının alıntılayabileceği kısa, kendi başına anlamlı cevaplar.
 */

const DIRECTORY: { title: string; href: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Altın',
    href: '/altin',
    links: [
      { label: 'Gram altın', href: '/altin/gram-altin' },
      { label: 'Çeyrek altın', href: '/altin/ceyrek-altin' },
      { label: 'Yarım altın', href: '/altin/yarim-altin' },
      { label: 'Tam altın', href: '/altin/tam-altin' },
      { label: 'Cumhuriyet altını', href: '/altin/cumhuriyet-altini' },
      { label: 'Ata altın', href: '/altin/ata-altin' },
      { label: 'Ons altın', href: '/altin/ons-altin' },
      { label: '22 ayar bilezik', href: '/altin/bilezik' },
      { label: 'Gümüş', href: '/altin/gumus' },
    ],
  },
  {
    title: 'Döviz',
    href: '/doviz',
    links: [
      { label: 'Dolar kuru', href: '/doviz/dolar' },
      { label: 'Euro kuru', href: '/doviz/euro' },
      { label: 'Sterlin', href: '/doviz/sterlin' },
      { label: 'İsviçre frangı', href: '/doviz/frang' },
      { label: 'Japon yeni', href: '/doviz/yen' },
      { label: 'Çin yuanı', href: '/doviz/yuan' },
      { label: 'Rus rublesi', href: '/doviz/ruble' },
    ],
  },
  {
    title: 'Borsa İstanbul',
    href: '/borsa',
    links: [
      { label: 'BIST 100', href: '/borsa/endeksler/XU100' },
      { label: 'Tüm endeksler', href: '/borsa?tab=endeksler' },
      { label: 'Tüm hisseler', href: '/borsa?tab=hisseler' },
      { label: 'THYAO', href: '/borsa/hisseler/THYAO' },
      { label: 'GARAN', href: '/borsa/hisseler/GARAN' },
      { label: 'AKBNK', href: '/borsa/hisseler/AKBNK' },
      { label: 'EREGL', href: '/borsa/hisseler/EREGL' },
      { label: 'TUPRS', href: '/borsa/hisseler/TUPRS' },
    ],
  },
  {
    title: 'Hesaplama',
    href: '/araclar',
    links: [
      { label: 'İhtiyaç kredisi', href: '/araclar/ihtiyac-kredisi' },
      { label: 'Konut kredisi', href: '/araclar/konut-kredisi' },
      { label: 'Maaş hesaplama', href: '/araclar/maas-hesaplama' },
      { label: 'Vadeli mevduat', href: '/araclar/vadeli-mevduat' },
      { label: 'Reel getiri', href: '/araclar/reel-getiri' },
      { label: 'Faiz hesaplama', href: '/araclar/faiz-hesaplama' },
      { label: 'Döviz çevirici', href: '/araclar/doviz-hesaplama' },
      { label: 'Altın çevirici', href: '/araclar/altin-hesaplama' },
    ],
  },
  {
    title: 'Veriler & rehber',
    href: '/enflasyon',
    links: [
      { label: 'Enflasyon (TÜFE / ÜFE)', href: '/enflasyon' },
      { label: 'TÜFE verileri', href: '/enflasyon/tuketici-fiyatlari' },
      { label: 'ÜFE verileri', href: '/enflasyon/uretici-fiyatlari' },
      { label: 'Enflasyon hesaplama', href: '/araclar/enflasyon-hesaplama' },
      { label: 'Bilgi merkezi', href: '/blog' },
    ],
  },
];

const FAQS = [
  {
    q: 'FinansÇözüm’deki fiyatlar ne sıklıkla güncellenir?',
    a: 'Altın ve döviz fiyatları piyasa açıkken canlı veri akışıyla anlık olarak güncellenir. Borsa İstanbul hisse ve endeks verileri, BIST veri yayın kuralları gereği 15 dakika gecikmeli gösterilir.',
  },
  {
    q: 'Altın fiyatları hangi kaynaklardan alınıyor?',
    a: 'Altın fiyatları serbest piyasa, Kapalıçarşı, Harem Altın, Altınkaynak, Garanti BBVA ve Akbank kaynaklarından derlenir. Her altın sayfasında kaynak bazında alış ve satış fiyatlarını ayrı ayrı görebilirsiniz.',
  },
  {
    q: 'Hesaplama araçlarını kullanmak ücretli mi?',
    a: 'Hayır. Kredi, maaş, mevduat, reel getiri, enflasyon ve döviz çevirici dahil 40’tan fazla finansal hesaplama aracı ücretsizdir ve üyelik gerektirmez.',
  },
  {
    q: 'İhtiyaç kredisi taksiti nasıl hesaplanır?',
    a: 'Aylık taksit, eşit taksitli (annüite) formülle hesaplanır. Tüketici kredilerinde faiz tutarı üzerinden %15 BSMV ve %15 KKDF alındığı için efektif aylık oran, faiz oranının 1,30 katı olarak alınır.',
  },
  {
    q: 'Reel getiri nedir, nasıl hesaplanır?',
    a: 'Reel getiri, bir yatırımın enflasyondan arındırılmış gerçek kazancıdır. Formülü: (1 + nominal getiri) ÷ (1 + enflasyon) − 1. Örneğin %40 getiri ve %30 enflasyonda reel getiri yaklaşık %7,7’dir.',
  },
];

export function DirectorySection() {
  return (
    <section aria-labelledby="directory-title" className="mx-auto max-w-[1440px] px-4 lg:px-8">
      <div className="grid gap-10 border-t border-border pt-14 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
        <div>
          <SectionHead id="directory-title" eyebrow="Hızlı erişim" title="Aradığınız her şey, tek sayfada" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 xl:grid-cols-5">
            {DIRECTORY.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h3 className="mb-3 text-sm font-medium text-foreground">
                  <Link href={col.href} className="hover:text-primary">
                    {col.title}
                  </Link>
                </h3>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div>
          <SectionHead id="faq-title" eyebrow="Sık sorulanlar" title="Kısa cevaplar" />
          <div className="divide-y divide-border border-y border-border">
            {FAQS.map((f, i) => (
              <details key={f.q} className="group" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] text-foreground marker:hidden [&::-webkit-details-marker]:hidden">
                  <h3 className="font-normal">{f.q}</h3>
                  <Plus className="h-4 w-4 shrink-0 text-primary transition-transform group-open:rotate-45" aria-hidden="true" />
                </summary>
                <p className="pb-5 pr-8 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
          <FAQSchema faqs={FAQS} />
        </div>
      </div>
    </section>
  );
}
