import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { SITE_NAME } from '@/lib/constants';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileNav } from '@/components/layout/MobileNav';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
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
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: SITE_NAME,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col`}
      >
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="dark"
          enableSystem={false}
        >
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <MobileNav />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: 'FinansCozum',
                url: 'https://finanscozum.net',
                logo: 'https://finanscozum.net/logo.png',
                sameAs: [],
              }),
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'FinansCozum',
                url: 'https://finanscozum.net',
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
