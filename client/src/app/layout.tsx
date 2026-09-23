import { Analytics } from '@/components/analytics/GoogleAnalytics';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Newsreader } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileNav } from '@/components/layout/MobileNav';
import './globals.css';

// latin-ext: ş, ğ, ı, İ gibi Türkçe glifler için şart (yoksa fallback font'a düşer)
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
});

// Başlık fontu — klasik gazete serif'i, optik boyut ekseniyle büyük puntoda sıkı durur
const displaySerif = Newsreader({
  variable: '--font-display-serif',
  subsets: ['latin', 'latin-ext'],
  axes: ['opsz'],
  style: ['normal'],
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0a0b0d' },
    { media: '(prefers-color-scheme: light)', color: '#f5f2ea' },
  ],
  colorScheme: 'dark light',
};

export const metadata: Metadata = {
  // ── Metadata Base ──
  // OG/Twitter image URL'lerini mutlak URL'e çevirir. Sayfa-bazlı
  // openGraph.images relative URL (`/api/og?...`) kullanır, bu base ile
  // mutlakağa dönüşür.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - Finansal Çözümler Platformu`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'Canlı altın fiyatları, borsa verileri, finansal hesaplama araçları ve güncel finans haberleri. Piyasaların nabzı burada.',
  keywords: [
    'altın fiyatları',
    'borsa istanbul',
    'hisse senedi',
    'döviz kuru',
    'finans',
    'yatırım',
    'hesaplama araçları',
    'canlı borsa',
  ],
  // ── Favicon & Icons ──
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'android-chrome', url: '/android-chrome-192x192.png', sizes: '192x192' },
    ],
  },
  manifest: '/site.webmanifest',
  // ── OpenGraph (sosyal paylaşım) ──
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Canlı Altın, Borsa, Döviz ve Finansal Araçlar`,
    description: 'Türkiye\'nin en kapsamlı finans platformu. Anlık altın, borsa, döviz verileri, hesaplama araçları ve güncel finans içerikleri.',
    url: 'https://finanscozum.net',
    images: [
      {
        url: 'https://finanscozum.net/og-default.png',
        width: 1200,
        height: 630,
        alt: 'FinansÇözüm - Canlı Finans Verileri Platformu',
        type: 'image/png',
      },
    ],
  },
  // ── Twitter Card ──
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} - Canlı Finans Verileri`,
    description: 'Canlı altın, borsa, döviz ve finansal hesaplama araçları.',
    images: ['https://finanscozum.net/og-default.png'],
    creator: '@finanscozum',
    site: '@finanscozum',
  },
  // ── Diğer ──
  authors: [{ name: 'FinansÇözüm Editör Ekibi', url: 'https://finanscozum.net/editor-ekibi' }],
  publisher: 'FinansÇözüm',
  category: 'finance',
  alternates: {
    canonical: 'https://finanscozum.net',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  verification: {
    // Google Search Console doğrulaması eklenecek
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${displaySerif.variable}`}
    >
      <head>
        {/* ── Performance: third-party DNS+TLS warmup ──
            Google Tag Manager ve Analytics için preconnect — DNS lookup
            + TLS handshake'i (~100-300ms) parse sırasında hazır olur.
            LCP (Largest Contentful Paint) mobilde 200ms+ iyileşme. */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      </head>
      <body
        className="atlas-grain flex min-h-screen flex-col"
      >
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="dark"
          enableSystem={false}
        >
          <Header />
          <main id="main" className="flex-1">{children}</main>
          <Footer />
          <MobileNav />
          <Analytics />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Organization',
                '@id': 'https://finanscozum.net/#organization',
                name: 'FinansCozum',
                alternateName: 'FinansÇözüm',
                url: 'https://finanscozum.net',
                logo: {
                  '@type': 'ImageObject',
                  url: 'https://finanscozum.net/logo.png',
                  width: 512,
                  height: 512,
                },
                description:
                  "Türkiye'nin bağımsız finans bilgi platformu. Canlı altın, borsa ve döviz verileri, hesaplama araçları, güncel finans haberleri.",
                foundingDate: '2025',
                areaServed: { '@type': 'Country', name: 'Türkiye' },
                inLanguage: 'tr-TR',
                contactPoint: [
                  {
                    '@type': 'ContactPoint',
                    contactType: 'customer support',
                    email: 'destek@finanscozum.com',
                    availableLanguage: ['Turkish'],
                  },
                  {
                    '@type': 'ContactPoint',
                    contactType: 'editorial',
                    email: 'editor@finanscozum.com',
                    availableLanguage: ['Turkish'],
                    description: 'Editör ekibi, içerik düzeltme ve öneri için',
                  },
                ],
                sameAs: [
                  'https://twitter.com/finanscozum',
                  'https://www.facebook.com/finanscozum',
                  'https://www.linkedin.com/company/finanscozum',
                  'https://www.instagram.com/finanscozum',
                ],
                knowsAbout: [
                  'Altın Fiyatları',
                  'Borsa İstanbul',
                  'Döviz Kurları',
                  'Hisse Senetleri',
                  'Yatırım',
                  'Finansal Hesaplama',
                  'Türk Lirası',
                  'Enflasyon',
                  'Merkez Bankası Politikaları',
                ],
              }),
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                '@id': 'https://finanscozum.net/#website',
                name: 'FinansCozum',
                alternateName: 'FinansÇözüm',
                url: 'https://finanscozum.net',
                description:
                  "Türkiye'nin bağımsız finans bilgi platformu: canlı altın, borsa, döviz, hesaplama araçları, finansal içerikler.",
                publisher: { '@id': 'https://finanscozum.net/#organization' },
                inLanguage: 'tr-TR',
                potentialAction: {
                  '@type': 'SearchAction',
                  target: 'https://finanscozum.net/borsa/hisseler?q={search_term_string}',
                  'query-input': 'required name=search_term_string',
                },
              }),
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
