import { safeJsonLd } from '@/lib/json-ld';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { notFound } from 'next/navigation';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { fitTitle } from '@/lib/seo-title';
import { PIECE_AMOUNTS, getPieceAmount } from '@/lib/seo-data/altin-amounts';
import { LivePieceTicker } from './LivePieceTicker';
import { FAQSchema } from '@/components/seo/FAQSchema';
import { AdBanner } from '@/components/ads/AdBanner';
import { Info, TrendingUp, ArrowRight, Calculator } from 'lucide-react';

export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return PIECE_AMOUNTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = getPieceAmount(slug);
  if (!item) return { title: 'Bulunamadı' };

  const canonical = `${SITE_URL}${item.path}`;
  return {
    title: fitTitle(item.title, `${item.count} adet ${item.goldName} kaç TL? Toplam fiyat`, `${item.count} ${item.goldName} kaç TL?`).title,
    description: item.description,
    keywords: [
      `${item.count} adet ${item.goldName.toLocaleLowerCase('tr-TR')}`,
      `${item.count} adet ${item.goldName.toLocaleLowerCase('tr-TR')} fiyatı`,
      `${item.count} ${item.goldName.toLocaleLowerCase('tr-TR')} kaç TL`,
      'altın fiyatları',
      'çeyrek altın',
      'tam altın',
    ],
    alternates: { canonical },
    openGraph: {
      type: 'article',
      title: item.title,
      description: item.description,
      url: canonical,
      siteName: SITE_NAME,
      locale: 'tr_TR',
      images: [{ url: `${SITE_URL}/og-default.png`, width: 1200, height: 630, alt: item.title }],
    },
  };
}

export default async function PieceAltinPage({ params }: Props) {
  const { slug } = await params;
  const item = getPieceAmount(slug);
  if (!item) notFound();

  const canonical = `${SITE_URL}${item.path}`;
  const pageTitle = item.title;

  const faqs = [
    {
      q: `${item.count} adet ${item.goldName.toLocaleLowerCase('tr-TR')} toplam kaç TL?`,
      a: `${item.count} adet ${item.goldName} güncel TL toplam fiyatı bu sayfada canlı olarak gösterilmektedir. Anlık alış-satış fiyatları otomatik olarak güncellenmektedir.`,
    },
    {
      q: `${item.count} adet ${item.goldName.toLocaleLowerCase('tr-TR')} almak mantıklı mı?`,
      a: `${item.count} adet ${item.goldName} almak, özellikle düğün, nişan veya toplu yatırım için uygun bir seçenektir. Ancak alım-satış makası ve saklama maliyetlerini göz önünde bulundurmanız önerilir.`,
    },
    {
      q: `${item.count} adet ${item.goldName.toLocaleLowerCase('tr-TR')} kaç gram?`,
      a: `Yaklaşık standart ağırlıklar: çeyrek 1,75 g, yarım 3,5 g, tam 7 g, Cumhuriyet ve ata 7,2 g, gremse 17,5 g. Bu altınlar 22 ayardır; saf altın içeriği ağırlığın yaklaşık %91,6'sıdır. Bu nedenle ${item.count} adet ${item.goldName.toLocaleLowerCase('tr-TR')} ile aynı ağırlıktaki gram (24 ayar) altının fiyatı aynı değildir.`,
    },
    {
      q: `Toplu ${item.goldName.toLocaleLowerCase('tr-TR')} alımında indirim var mı?`,
      a: `Kuyumcular genellikle toplu alımlarda küçük oranda indirim veya daha iyi fiyat verebilir. Bankalar ise genellikle sabit fiyat uygular. ${item.count} adet alım için birden fazla kuyumcudan teklif almanız önerilir.`,
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': canonical,
        url: canonical,
        name: pageTitle,
        description: item.description,
        inLanguage: 'tr-TR',
        isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: ['#piece-summary', 'h1'],
        },
      },
      {
        '@type': 'FinancialProduct',
        name: `${item.count} Adet ${item.goldName}`,
        description: item.description,
        category: 'Altın',
        url: canonical,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <FAQSchema faqs={faqs} />

      <article className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
        <Breadcrumb items={[{ label: 'Ana Sayfa', href: '/' }, { label: 'Altın', href: '/altin' }, { label: item.goldName, href: `/altin/${item.goldSlug}` }, { label: `${item.count} adet` }]} />

        <header className="mb-6">
          <h1 className="font-display text-balance text-4xl text-foreground sm:text-5xl">
            {item.count} Adet {item.goldName} Kaç TL?
          </h1>
          <p id="piece-summary" className="mt-3 text-base text-muted-foreground lg:text-lg">
            <strong>{item.count} adet {item.goldName.toLocaleLowerCase('tr-TR')}</strong> güncel Türk Lirası
            toplam fiyatı bu sayfada canlı olarak gösterilir. Veriler anlık olarak güncellenir;
            alış-satış fiyatları, son 24 saatlik değişim ve yatırım tavsiyelerini takip edebilirsiniz.
          </p>
        </header>

        <LivePieceTicker count={item.count} goldType={item.goldName} goldSlug={item.goldSlug} />

        <AdBanner page={`altin-adet-${item.slug}`} position="in-article" className="my-8" />

        <section className="prose prose-slate dark:prose-invert mt-8 max-w-none">
          <h2 className="font-display text-2xl text-foreground sm:text-3xl mb-3">
            {item.count} Adet {item.goldName} Detayları
          </h2>
          <p>
            {item.count} adet {item.goldName.toLocaleLowerCase('tr-TR')} toplam yatırım maliyetini
            hesaplamak için aşağıdaki bilgileri kullanabilirsiniz. Sayfa, anlık piyasa
            verilerine göre otomatik güncellenmektedir.
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-2">Hesaplama Formülü</h3>
          <p>
            <code className="rounded bg-muted px-2 py-1 text-sm">
              Toplam = {item.count} adet × (1 adet {item.goldName} güncel fiyatı)
            </code>
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-2">
            {item.count} Adet Ne Kadar Kullanım Alanı?
          </h3>
          <p>
            {item.count} adet {item.goldName.toLocaleLowerCase('tr-TR')} özellikle şu durumlar için tercih edilir:
          </p>
          <ul>
            {item.count >= 50 && <li><strong>Toplu yatırım</strong> için ideal — uzun vadeli birikim aracı</li>}
            {item.count >= 20 && item.count < 50 && <li><strong>Aile yatırımı</strong> veya küçük ölçekli toplu alım</li>}
            {item.count >= 5 && item.count < 20 && <li><strong>Nişan, söz</strong> veya özel günler için toplu hediye</li>}
            {item.count < 5 && <li><strong>Bireysel yatırım</strong> veya küçük ölçekli birikim</li>}
            <li>Düğün masrafı karşılama</li>
            <li>Çocukların geleceği için birikim (18 yıl × ayda 1 adet mantığı)</li>
            <li>Enflasyona karşı portföy çeşitlendirmesi</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 mb-2">Almadan Önce Tavsiyeler</h3>
          <ol>
            <li><strong>Fiyat karşılaştırması yapın:</strong> 3-4 farklı kuyumcudan teklif alın</li>
            <li><strong>Alış-satış makasını sorun:</strong> Has altın makası düşük yerleri tercih edin</li>
            <li><strong>Sertifika isteyin:</strong> Altının ayarı ve ağırlığı belgelendirilmiş olmalı</li>
            <li><strong>Banka seçeneğini değerlendirin:</strong> Bankadan alınan altınlar genelde makası düşüktür</li>
            <li><strong>Zamanlama:</strong> Gram altın fiyatı düşüş trendindeyse alım yapın</li>
          </ol>
        </section>

        {/* FAQ */}
        <section className="mt-10">
          <h2 className="font-display text-2xl text-foreground sm:text-3xl mb-4">Sıkça Sorulan Sorular</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="group atlas-card p-4"
              >
                <summary className="flex cursor-pointer items-center justify-between font-medium">
                  {faq.q}
                  <Info className="h-4 w-4 text-muted-foreground group-open:rotate-180 transition-transform" />
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Related Links */}
        <section className="mt-10 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-6">
          <h2 className="font-display text-2xl text-foreground sm:text-3xl mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            İlgili Sayfalar
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link
              href={`/altin/${item.goldSlug}`}
              className="flex items-center justify-between atlas-card p-3 hover:border-primary/50"
            >
              <span className="text-sm font-medium">1 Adet {item.goldName}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link
              href="/altin/gram-altin"
              className="flex items-center justify-between atlas-card p-3 hover:border-primary/50"
            >
              <span className="text-sm font-medium">Gram Altın</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link
              href="/altin"
              className="flex items-center justify-between atlas-card p-3 hover:border-primary/50 sm:col-span-2"
            >
              <span className="text-sm font-medium">Tüm Altın Türleri</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link
              href="/araclar/altin-hesaplama"
              className="flex items-center justify-between atlas-card p-3 hover:border-primary/50 sm:col-span-2"
            >
              <span className="text-sm font-medium flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                Altın Çeviri Hesaplama Aracı
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>
        </section>
      </article>
    </>
  );
}
