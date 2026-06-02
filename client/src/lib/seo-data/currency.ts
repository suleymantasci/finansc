// ── Döviz Pariteleri Statik Veri ──

export interface CurrencyMeta {
  code: string;
  name: string;
  slug: string;
  country: string;
  description: string;
  faq: { q: string; a: string }[];
  relatedSlugs: string[];
}

export const CURRENCY_META: Record<string, CurrencyMeta> = {
  USD: {
    code: 'USD',
    name: 'ABD Doları',
    slug: 'dolar',
    country: 'Amerika Birleşik Devletleri',
    description:
      'USD/TRY (Amerikan Doları / Türk Lirası) canlı kuru, serbest piyasa ve Merkez Bankası verileri. ABD Doları, dünyanın en yaygın rezerv para birimidir. Türkiye\'de en çok takip edilen döviz kurudur.',
    faq: [
      {
        q: 'Dolar kuru neden yükselir?',
        a: 'Dolar kuru; Türkiye enflasyonu, faiz politikası, jeopolitik riskler, küresel dolar endeksi (DXY) ve TCMB politikalarına bağlı olarak değişir.',
      },
      {
        q: 'Serbest piyasa ile Merkez Bankası kuru arasındaki fark nedir?',
        a: 'Serbest piyasa kuru bankalar ve döviz bürolarının alış-satış fiyatıdır. Merkez Bankası kuru ise resmi kurdur. İkisi arasında genellikle küçük fark olur.',
      },
      {
        q: '1 dolar kaç TL?',
        a: '1 doların TL karşılığı anlık değişir. Güncel fiyatı bu sayfada canlı olarak görebilirsiniz.',
      },
    ],
    relatedSlugs: ['euro', 'sterlin', 'gram-altin'],
  },

  EUR: {
    code: 'EUR',
    name: 'Euro',
    slug: 'euro',
    country: 'Avrupa Birliği',
    description:
      'EUR/TRY (Euro / Türk Lirası) canlı kuru. Euro, Avrupa Birliği\'nin ortak para birimidir. Dolar ile birlikte dünyanın en önemli iki rezerv parasından biridir.',
    faq: [
      {
        q: 'Euro kuru neden dalgalanır?',
        a: 'Euro kuru; Avrupa Merkez Bankası (ECB) faiz kararları, enflasyon verileri, ekonomik büyüme ve jeopolitik gelişmelere göre değişir.',
      },
      {
        q: 'Euro mu dolar mı almak daha mantıklı?',
        a: 'Her ikisi de güçlü rezerv parasıdır. Yatırım tercihi kişisel risk iştahına ve piyasa beklentilerine bağlıdır.',
      },
    ],
    relatedSlugs: ['dolar', 'sterlin', 'frang'],
  },

  GBP: {
    code: 'GBP',
    name: 'İngiliz Sterlini',
    slug: 'sterlin',
    country: 'Birleşik Krallık',
    description:
      'GBP/TRY (İngiliz Sterlini / Türk Lirası) canlı kuru. Sterlin, dünyanın en eski para birimlerinden biridir ve en yüksek değerli para birimlerinden biridir.',
    faq: [
      {
        q: 'Sterlin neden yüksek değerli?',
        a: 'Sterlin, İngiltere\'nin güçlü finans merkezi (Londra) ve uzun ekonomik geçmişi nedeniyle yüksek değerlidir.',
      },
    ],
    relatedSlugs: ['dolar', 'euro', 'frang'],
  },

  XAU: {
    code: 'XAU',
    name: 'Ons Altın',
    slug: 'ons-altin',
    country: 'Uluslararası',
    description:
      'XAU/TRY (Ons Altın / Türk Lirası) canlı kuru. Ons altın, küresel altın piyasasının temel ölçü birimidir. 1 ons = 31,1035 gram saf altın.',
    faq: [
      {
        q: 'Ons altın fiyatı neden önemli?',
        a: 'Ons altın, küresel altın fiyatını belirler. Türkiye\'de gram altın, çeyrek altın gibi tüm altın türlerinin fiyatı ons altın üzerinden hesaplanır.',
      },
    ],
    relatedSlugs: ['gram-altin', 'dolar', 'gumus-ons'],
  },

  CHF: {
    code: 'CHF',
    name: 'İsviçre Frangı',
    slug: 'frang',
    country: 'İsviçre',
    description:
      'CHF/TRY (İsviçre Frangı / Türk Lirası) canlı kuru. İsviçre Frangı, güvenli liman para birimi olarak bilinir. Özellikle belirsizlik dönemlerinde değer kazanır.',
    faq: [
      {
        q: 'Frang neden güvenli liman?',
        a: 'İsviçre\'nin düşük enflasyon, politik istikrar ve güçlü bankacılık sistemi frangı güvenli liman yapar.',
      },
    ],
    relatedSlugs: ['dolar', 'euro', 'sterlin'],
  },

  JPY: {
    code: 'JPY',
    name: 'Japon Yeni',
    slug: 'yen',
    country: 'Japonya',
    description:
      'JPY/TRY (Japon Yeni / Türk Lirası) canlı kuru. Japon Yeni, dünyanın en çok işlem gören para birimlerinden biridir. Asya ticaretinde önemli rol oynar.',
    faq: [
      {
        q: 'Yen neden değer kaybediyor?',
        a: 'Japonya\'nın uzun süredir devam eden düşük faiz politikası ve düşük enflasyon ortamı yenin değer kaybetmesine neden olabilir.',
      },
    ],
    relatedSlugs: ['dolar', 'yuan', 'euro'],
  },

  CNY: {
    code: 'CNY',
    name: 'Çin Yuanı',
    slug: 'yuan',
    country: 'Çin',
    description:
      'CNY/TRY (Çin Yuanı / Türk Lirası) canlı kuru. Çin Yuanı, dünya ticaretinde dolar ve euro\'dan sonra en çok kullanılan para birimlerinden biridir.',
    faq: [
      {
        q: 'Yuan uluslararası rezerv para mı?',
        a: 'Evet, yuan IMF özel çekme hakları (SDR) sepetinde yer alan beş para biriminden biridir.',
      },
    ],
    relatedSlugs: ['dolar', 'euro', 'yen'],
  },

  RUB: {
    code: 'RUB',
    name: 'Rus Rublesi',
    slug: 'ruble',
    country: 'Rusya',
    description:
      'RUB/TRY (Rus Rublesi / Türk Lirası) canlı kuru. Rus Rublesi, Türkiye ile Rusya arasındaki artan ticaret hacmi nedeniyle önem kazanmaktadır.',
    faq: [
      {
        q: 'Türkiye-Rusya ticaretinde hangi para birimi kullanılıyor?',
        a: 'İkili ticarette artan oranda ruble ve Türk Lirası kullanılmaktadır. Rusya Merkez Bankası da rublenin uluslararasılaşmasını teşvik etmektedir.',
      },
    ],
    relatedSlugs: ['dolar', 'euro', 'yuan'],
  },
};

export const CURRENCY_SLUGS = Object.values(CURRENCY_META).map((c) => c.slug);

export function getCurrencyBySlug(slug: string): CurrencyMeta | null {
  return Object.values(CURRENCY_META).find((c) => c.slug === slug) ?? null;
}

// Backend currency name → meta code eşlemesi
export function currencyNameToCode(name: string): string | null {
  const map: Record<string, string> = {
    'Amerikan Doları': 'USD',
    'Dolar': 'USD',
    'USD': 'USD',
    'Euro': 'EUR',
    'EUR': 'EUR',
    'İngiliz Sterlini': 'GBP',
    'Sterlin': 'GBP',
    'GBP': 'GBP',
    'İsviçre Frangı': 'CHF',
    'Frang': 'CHF',
    'CHF': 'CHF',
    'Japon Yeni': 'JPY',
    'Yen': 'JPY',
    'JPY': 'JPY',
    'Çin Yuanı': 'CNY',
    'Yuan': 'CNY',
    'CNY': 'CNY',
    'Rus Rublesi': 'RUB',
    'Ruble': 'RUB',
    'RUB': 'RUB',
  };
  return map[name] ?? null;
}
