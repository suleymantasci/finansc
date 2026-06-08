// ── Site ──
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'FinansÇözüm';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ── Navigation ──
export const NAV_ITEMS = [
  { label: 'Altın', href: '/altin', icon: 'Coins' },
  { label: 'Döviz', href: '/doviz', icon: 'Banknote' },
  { label: 'Borsa', href: '/borsa', icon: 'TrendingUp' },
  { label: 'Bilgi Merkezi', href: '/blog', icon: 'FileText' },
  { label: 'Araçlar', href: '/araclar', icon: 'Calculator' },
] as const;

export const FOOTER_LINKS = {
  piyasalar: [
    { label: 'Altın Fiyatları', href: '/altin' },
    { label: 'Döviz Kurları', href: '/doviz' },
    { label: 'Borsa', href: '/borsa' },
    { label: 'Hisse Senetleri', href: '/borsa?tab=hisseler' },
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
    { label: 'İletişim', href: '/iletisim' },
    { label: 'Gizlilik Politikası', href: '/gizlilik' },
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
