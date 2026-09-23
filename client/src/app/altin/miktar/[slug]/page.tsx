import { safeJsonLd } from '@/lib/json-ld';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { GRAM_AMOUNTS, getGramAmount } from '@/lib/seo-data/altin-amounts';
import { LiveGoldTicker } from './LiveGoldTicker';
import { FAQSchema } from '@/components/seo/FAQSchema';
import { AdBanner } from '@/components/ads/AdBanner';
import { Calculator, Info, TrendingUp, ArrowRight } from 'lucide-react';

export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return GRAM_AMOUNTS.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const amount = getGramAmount(slug);
  if (!amount) return { title: 'Bulunamadı' };

  const canonical = `${SITE_URL}${amount.path}`;
  return {
    title: amount.title,
    description: amount.description,
    keywords: [
      `${amount.grams} gram altın`,
      `${amount.grams} gr altın kaç TL`,
      `${amount.grams} gram altın fiyatı`,
      'gram altın',
      'altın fiyatları',
      'canlı altın',
    ],
    alternates: { canonical },
    openGraph: {
      type: 'article',
      title: amount.title,
      description: amount.description,
      url: canonical,
      siteName: SITE_NAME,
      locale: 'tr_TR',
      images: [{ url: `${SITE_URL}/og-default.png`, width: 1200, height: 630, alt: amount.title }],
    },
  };
}

export default async function GramAltinPage({ params }: Props) {
  const { slug } = await params;
  const amount = getGramAmount(slug);
  if (!amount) notFound();

  const canonical = `${SITE_URL}${amount.path}`;
  const pageTitle = amount.title;

  const faqs = [
    {
      q: `${amount.grams} gram altın ne kadar?`,
      a: `${amount.grams} gram altının güncel TL fiyatı bu sayfada canlı olarak gösterilmektedir. Veriler anlık olarak güncellenir ve Borsa İstanbul ile serbest piyasa verilerine dayanır.`,
    },
    {
      q: `${amount.grams} gram altın yatırım için uygun mu?`,
      a: `${amount.grams} gram altın, düşük bütçeli yatırımcılar için ideal bir başlangıç noktasıdır. Küçük miktarlarla altın biriktirmek, portföy çeşitlendirmesi sağlar. Ancak alım-satım maliyetlerini göz önünde bulundurmanız önerilir.`,
    },
    {
      q: `${amount.grams} gram altın nasıl hesaplanır?`,
      a: `${amount.grams} gram altının TL fiyatı, gram altının anlık fiyatının ${amount.grams} ile çarpılmasıyla hesaplanır. Bu sayfadaki hesaplama otomatik olarak güncellenmektedir.`,
    },
    {
      q: `${amount.grams} gram altın ile kaç çeyrek altın alınır?`,
      a: `Bir çeyrek altın yaklaşık 1.75 gramdır. ${amount.grams} gram altın ile yaklaşık ${(amount.grams / 1.75).toFixed(2)} adet çeyrek altın alabilirsiniz (anlık fiyatlara göre değişir).`,
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
        description: amount.description,
        inLanguage: 'tr-TR',
        isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: ['#gold-summary', 'h1'],
        },
      },
      {
        '@type': 'FinancialProduct',
        name: `${amount.grams} Gram Altın`,
        description: amount.description,
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
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
          <ol className="flex items-center gap-1">
            <li><Link href="/" className="hover:text-primary">Ana Sayfa</Link></li>
            <li>/</li>
            <li><Link href="/altin" className="hover:text-primary">Altın</Link></li>
            <li>/</li>
            <li><Link href="/altin/gram-altin" className="hover:text-primary">Gram Altın</Link></li>
            <li>/</li>
            <li className="text-foreground">{amount.grams} gram</li>
          </ol>
        </nav>

        <header className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight lg:text-4xl">
            {amount.grams} Gram Altın Kaç TL?
          </h1>
          <p id="gold-summary" className="mt-3 text-base text-muted-foreground lg:text-lg">
            <strong>{amount.grams} gram altın</strong> güncel Türk Lirası fiyatı bu sayfada canlı
            olarak gösterilir. Veriler anlık olarak güncellenir; alış-satış fiyatları, son 24
            saatlik değişim ve aylık performansı takip edebilirsiniz.
          </p>
        </header>

        <LiveGoldTicker grams={amount.grams} />

        <AdBanner page={`altin-miktar-${amount.slug}`} position="in-article" className="my-8" />

        <section className="prose prose-slate dark:prose-invert mt-8 max-w-none">
          <h2 className="text-xl font-semibold mb-3">{amount.grams} Gram Altın Hakkında</h2>
          <p>
            {amount.grams} gram altın, Türkiye&apos;deki yatırımcılar için önemli bir referans
            noktasıdır. Özellikle küçük birikimlerini değerlendirmek isteyenler tarafından
            tercih edilir. Aşağıda {amount.grams} gram altının TL karşılığını, çeyrek altın
            eşdeğerini ve yatırım tavsiyelerini bulabilirsiniz.
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-2">Hesaplama Formülü</h3>
          <p>
            {amount.grams} gram altının TL fiyatı şu formülle hesaplanır:
            <br />
            <code className="rounded bg-muted px-2 py-1 text-sm">
              {amount.grams} gr altın = {amount.grams} × (gram altının güncel fiyatı)
            </code>
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-2">{amount.grams} Gram = Kaç Çeyrek?</h3>
          <p>
            Standart çeyrek altın 1.75 gramdır. Buna göre <strong>{amount.grams} gram altın</strong>
            {' '}ile yaklaşık <strong>{(amount.grams / 1.75).toFixed(2)} adet çeyrek altın</strong>
            {' '}alınabilir (alış-satış makası hariç).
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-2">Neden {amount.grams} Gram Altın Tercih Edilir?</h3>
          <ul>
            <li><strong>Düşük bütçeli yatırımcılar</strong> için ideal başlangıç noktasıdır</li>
            <li>Likit ve kolay alınıp satılabilir</li>
            <li>Enflasyona karşı korunma aracı olarak portföy çeşitlendirmesi sağlar</li>
            <li>Düğün, nişan, sünnet gibi özel günlerde hediye olarak verilebilir</li>
            <li>Vergi avantajı (ziynet altını için KDV muafiyeti söz konusudur)</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 mb-2">Almadan Önce Dikkat Edilmesi Gerekenler</h3>
          <ol>
            <li><strong>Alış-satış makası:</strong> Kuyumcular ve bankalar arasında %3-5 fark olabilir</li>
            <li><strong>Has altın olmalı:</strong> 24 ayar (999.9) veya 22 ayar (916) olduğundan emin olun</li>
            <li><strong>Marka/güvenilirlik:</strong> Tanınmış kuyumculardan veya bankalardan alışveriş yapın</li>
            <li><strong>Saklama maliyeti:</strong> Evde saklama riskine karşı banka kasası değerlendirilebilir</li>
          </ol>
        </section>

        {/* FAQ */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Sıkça Sorulan Sorular</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="group rounded-lg border border-border bg-card p-4"
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
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            İlgili Altın Sayfaları
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link
              href="/altin/gram-altin"
              className="flex items-center justify-between rounded-lg border border-border bg-card p-3 hover:border-primary/50"
            >
              <span className="text-sm font-medium">Gram Altın (1 gr)</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link
              href="/altin/ceyrek-altin"
              className="flex items-center justify-between rounded-lg border border-border bg-card p-3 hover:border-primary/50"
            >
              <span className="text-sm font-medium">Çeyrek Altın</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link
              href="/altin/tam-altin"
              className="flex items-center justify-between rounded-lg border border-border bg-card p-3 hover:border-primary/50"
            >
              <span className="text-sm font-medium">Tam Altın</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link
              href="/altin/ons-altin"
              className="flex items-center justify-between rounded-lg border border-border bg-card p-3 hover:border-primary/50"
            >
              <span className="text-sm font-medium">Ons Altın (XAU/USD)</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link
              href="/araclar/altin-hesaplama"
              className="flex items-center justify-between rounded-lg border border-border bg-card p-3 hover:border-primary/50 sm:col-span-2"
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
