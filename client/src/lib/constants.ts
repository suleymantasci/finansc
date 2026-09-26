// ── Site ──
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'FinansÇözüm';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
/**
 * Sunucuda (SSR/ISR/build) API_INTERNAL_URL varsa onu kullan: istekler Traefik ve
 * dış ağ yerine doğrudan backend'e gider (hızlı, rate limit'e takılmaz).
 * Tarayıcıda her zaman herkese açık adres.
 */
export const API_URL = typeof window === 'undefined' ? process.env.API_INTERNAL_URL || PUBLIC_API_URL : PUBLIC_API_URL;

// ── Navigation ──
// Literal-union: ya direkt link ya da dropdown. `href` yoksa `children` zorunlu.
export type NavItem =
  | { label: string; href: string; icon: string }
  | { label: string; icon: string; children: { label: string; href: string; description?: string }[] };

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Altın', href: '/altin', icon: 'Coins' },
  { label: 'Döviz', href: '/doviz', icon: 'Banknote' },
  { label: 'Borsa', href: '/borsa', icon: 'TrendingUp' },
  { label: 'Emtia', href: '/emtia', icon: 'Fuel' },
  {
    label: 'Veriler',
    icon: 'BarChart3',
    children: [
      { label: 'Enflasyon', href: '/enflasyon', description: 'TÜFE ve ÜFE verileri' },
      { label: 'TÜFE — Tüketici Fiyatları', href: '/enflasyon/tuketici-fiyatlari' },
      { label: 'ÜFE / Yİ-ÜFE — Üretici Fiyatları', href: '/enflasyon/uretici-fiyatlari' },
    ],
  },
  { label: 'Bilgi Merkezi', href: '/blog', icon: 'FileText' },
  { label: 'Araçlar', href: '/araclar', icon: 'Calculator' },
] as const;

export const FOOTER_LINKS = {
  piyasalar: [
    { label: 'Altın Fiyatları', href: '/altin' },
    { label: 'Döviz Kurları', href: '/doviz' },
    { label: 'Borsa', href: '/borsa' },
    { label: 'Hisse Senetleri', href: '/borsa?tab=hisseler' },
    { label: 'Emtia Fiyatları', href: '/emtia' },
    { label: 'Enflasyon (TÜFE / ÜFE)', href: '/enflasyon' },
  ],
  araclar: [
    { label: 'Kredi Hesaplama', href: '/araclar/ihtiyac-kredisi' },
    { label: 'Maaş Hesaplama', href: '/araclar/maas-hesaplama' },
    { label: 'Vadeli Mevduat', href: '/araclar/vadeli-mevduat' },
    { label: 'Reel Getiri', href: '/araclar/reel-getiri' },
    { label: 'Paranın Değeri', href: '/araclar/parasal-deger' },
  ],
  kurumsal: [
    { label: 'Hakkımızda', href: '/hakkimizda' },
    { label: 'Künye', href: '/hakkimizda#kunye' },
    { label: 'İletişim', href: '/iletisim' },
    { label: 'Gizlilik ve KVKK Aydınlatma', href: '/gizlilik' },
    { label: 'Çerez Politikası', href: '/cerez-politikasi' },
    { label: 'Kullanım Şartları', href: '/kullanim-sartlari' },
  ],
} as const;

// ── Gold Sources ──
export const GOLD_SOURCES = [
  { key: 'serbest-piyasa', label: 'Serbest Piyasa' },
  { key: 'harem', label: 'Harem Altın' },
  { key: 'altinkaynak', label: 'Altınkaynak' },
  { key: 'kapalicarsi', label: 'Kapalıçarşı' },
  { key: 'garanti-bbva', label: 'Garanti BBVA' },
  { key: 'akbank', label: 'Akbank' },
] as const;

// ── Market ──
export const MARKET_REFRESH_INTERVAL = 10_000; // 10 seconds for REST polling
export const SSE_RECONNECT_DELAY = 3_000; // 3 seconds SSE reconnect

// ── Pagination ──
export const DEFAULT_PAGE_SIZE = 20;

// ── Auth ──
export const AUTH_TOKEN_KEY = 'finanscozum-auth';
export const PROTECTED_ROUTES = ['/hesabim', '/admin'];
export const AUTH_ROUTES = ['/giris', '/kayit', '/sifremi-unuttum'];
export const ADMIN_ROUTES = ['/admin'];
