// ── Altın Türleri Statik Veri ──
// Programmatic SEO + structured data için.

export interface GoldTypeMeta {
  slug: string;
  name: string;
  shortName: string;
  purity?: string;
  weight?: string;
  description: string;
  faq: { q: string; a: string }[];
  relatedSlugs: string[];
}

export const GOLD_META: Record<string, GoldTypeMeta> = {
  'gram-altin': {
    slug: 'gram-altin',
    name: 'Gram Altın',
    shortName: 'Gram',
    purity: '24 ayar (saf)',
    weight: '1 gram',
    description:
      'Gram altın, 24 ayar saf altından oluşan 1 gram ağırlığındaki altın türüdür. Yatırımcılar için en likit altın türlerinden biridir çünkü küçük meblağlarla alım-satım yapılabilir. Türkiye\'de gram altın fiyatı, uluslararası ons altın fiyatı ve USD/TRY kuru üzerinden hesaplanır.',
    faq: [
      {
        q: 'Gram altın fiyatı nasıl belirlenir?',
        a: 'Gram altın fiyatı, uluslararası ons altın fiyatı (1 ons = 31,1035 gram) ve USD/TRY döviz kuru çarpılarak hesaplanır. Serbest piyasada alış-satış farkı (spread) uygulanır.',
      },
      {
        q: '1 gram altın kaç TL?',
        a: 'Gram altın TL fiyatı anlık olarak değişir. Güncel fiyatı bu sayfada anlık olarak görebilirsiniz. Fiyatlar serbest piyasa, Kapalıçarşı, Harem Altın, Altınkaynak, Garanti BBVA ve Akbank kaynaklarından derlenir.',
      },
      {
        q: 'Gram altın yatırım için uygun mu?',
        a: 'Evet, gram altın küçük yatırımlar için idealdir. Düşük alım-satım farkı, yüksek likidite ve kolay alım-satım imkânı sunar.',
      },
    ],
    relatedSlugs: ['ceyrek-altin', 'yarim-altin', 'tam-altin', 'ons-altin'],
  },

  'ceyrek-altin': {
    slug: 'ceyrek-altin',
    name: 'Çeyrek Altın',
    shortName: 'Çeyrek',
    purity: '22 ayar',
    weight: '1,75 gram',
    description:
      'Çeyrek altın, Türkiye\'de en yaygın kullanılan altın türlerinden biridir. 22 ayar olup yaklaşık 1,75 gram ağırlığındadır. Düğün, nişan ve özel günlerde hediye olarak sıklıkla tercih edilir. Çeyrek altın, gram altının yaklaşık 1,75 katı fiyatından işlem görür.',
    faq: [
      {
        q: 'Çeyrek altın kaç gram?',
        a: 'Çeyrek altın 22 ayar olup 1,75 gram ağırlığındadır. Bunun 1,60 gramı saf altın, kalan 0,15 gramı bakır ve gümüş alaşımıdır.',
      },
      {
        q: 'Çeyrek altın ile gram altın arasındaki fark nedir?',
        a: 'Çeyrek altın 22 ayar (has altın oranı %91,6), gram altın ise 24 ayar (has altın oranı %99,5) üretilir. Fiyat olarak çeyrek altın, gram altının yaklaşık 1,75 katıdır.',
      },
      {
        q: 'Eski çeyrek altın ne demek?',
        a: 'Eski çeyrek altın, 2018 öncesi basılan ve çapı farklı olan çeyrek altınlardır. Ağırlık ve has altın oranı aynıdır, ancak farklı basım özelliklerinden dolayı piyasada küçük fiyat farkı oluşabilir.',
      },
    ],
    relatedSlugs: ['gram-altin', 'yarim-altin', 'tam-altin'],
  },

  'yarim-altin': {
    slug: 'yarim-altin',
    name: 'Yarım Altın',
    shortName: 'Yarım',
    purity: '22 ayar',
    weight: '3,5 gram',
    description:
      'Yarım altın, 22 ayar olup yaklaşık 3,5 gram ağırlığındadır. Çeyrek altının iki katı büyüklüğündedir. Düğün, nişan ve özel günlerde hediye olarak sıklıkla tercih edilir. Yarım altın fiyatı, çeyrek altının yaklaşık iki katıdır.',
    faq: [
      {
        q: 'Yarım altın kaç gram?',
        a: 'Yarım altın 22 ayar olup 3,5 gram ağırlığındadır. Çeyrek altının iki katı büyüklüğündedir.',
      },
      {
        q: 'Yarım altın mı çeyrek altın mı almak daha mantıklı?',
        a: 'İkisi de 22 ayar ve aynı has altın oranına sahiptir. Yatırım açısından fiyat/kütle oranı aynıdır. Tercih genellikle hediye amaçlı kullanıma göre değişir.',
      },
    ],
    relatedSlugs: ['ceyrek-altin', 'tam-altin', 'gram-altin'],
  },

  'tam-altin': {
    slug: 'tam-altin',
    name: 'Tam Altın',
    shortName: 'Tam',
    purity: '22 ayar',
    weight: '7 gram',
    description:
      'Tam altın (Ziynet Altını), 22 ayar olup yaklaşık 7 gram ağırlığındadır. Çeyrek altının dört katı büyüklüğündedir. Düğünlerde çeyrek ve yarım altın yerine sıklıkla tam altın tercih edilir. Tam altın fiyatı, çeyrek altının yaklaşık dört katıdır.',
    faq: [
      {
        q: 'Tam altın kaç gram?',
        a: 'Tam altın 22 ayar olup 7 gram ağırlığındadır. Has altın miktarı yaklaşık 6,4 gramdır.',
      },
      {
        q: 'Tam altın yatırım için uygun mu?',
        a: 'Tam altın, gram altına göre daha yüksek alım-satım farkına sahip olabilir. Yatırım amaçlı gram altın veya cumhuriyet altını daha likit olabilir.',
      },
    ],
    relatedSlugs: ['yarim-altin', 'ceyrek-altin', 'cumhuriyet-altini'],
  },

  'cumhuriyet-altini': {
    slug: 'cumhuriyet-altini',
    name: 'Cumhuriyet Altını',
    shortName: 'Cumhuriyet',
    purity: '22 ayar',
    weight: '7,2 gram',
    description:
      'Cumhuriyet altını, Türkiye Cumhuriyeti\'nin kuruluşunu simgeleyen özel basım altın sikkedir. 22 ayar olup 7,2 gram ağırlığındadır. Tarihi ve kültürel değeri nedeniyle yatırımcılar tarafından sıklıkla tercih edilir. Özellikle koleksiyon amaçlı alıcı kitlesi vardır.',
    faq: [
      {
        q: 'Cumhuriyet altını ile tam altın arasındaki fark nedir?',
        a: 'Cumhuriyet altını 7,2 gram, tam altın ise 7 gramdır. Cumhuriyet altını özel basım olduğu için hafif farklı fiyatlanır.',
      },
      {
        q: 'Cumhuriyet altını neden daha pahalı?',
        a: 'Cumhuriyet altının fiyatı sadece altın içeriğine değil, aynı zamanda basım özelliklerine ve koleksiyon değerine göre belirlenir.',
      },
    ],
    relatedSlugs: ['tam-altin', 'ata-altin', 'gram-altin'],
  },

  'ata-altin': {
    slug: 'ata-altin',
    name: 'Ata Altın',
    shortName: 'Ata',
    purity: '22 ayar',
    weight: '7,2 gram',
    description:
      'Ata altın, Cumhuriyet altınına benzer şekilde özel basım altın sikkedir. 22 ayar olup yaklaşık 7,2 gram ağırlığındadır. Çeyrek, yarım, tam ve 2,5\'luk gibi farklı boyutlarda basılır.',
    faq: [
      {
        q: 'Ata altın kaç gram?',
        a: 'Ata altının tam boyutlu olanı 7,2 gramdır. Çeyrek, yarım, tam ve 2,5\'luk seçenekleri mevcuttur.',
      },
    ],
    relatedSlugs: ['cumhuriyet-altini', 'tam-altin'],
  },

  'ons-altin': {
    slug: 'ons-altin',
    name: 'Ons Altın',
    shortName: 'Ons',
    purity: '24 ayar (saf)',
    weight: '31,1035 gram',
    description:
      'Ons altın, uluslararası altın fiyatının temel ölçü birimidir. 1 ons = 31,1035 gram saf altına eşdeğerdir. Küresel altın piyasası ons üzerinden işlem görür. Türkiye\'de gram altın fiyatı, ons altının TL karşılığı kullanılarak hesaplanır.',
    faq: [
      {
        q: '1 ons altın kaç gram?',
        a: '1 ons altın 31,1035 gramdır. Uluslararası piyasalarda altın ons üzerinden fiyatlanır.',
      },
      {
        q: 'Ons altın yükselirse gram altın da yükselir mi?',
        a: 'Genellikle evet. Ons altın yükseldiğinde ve USD/TRY kuru da sabit kaldığında, gram altın fiyatı da yükselir. Ancak döviz kuru değişiklikleri gram altını ters yönde etkileyebilir.',
      },
      {
        q: 'Ons altın nereden alınır?',
        a: 'Bireysel yatırımcılar doğrudan ons altın alamaz. Ons altına yatırım, gram altın, altın ETF\'leri veya altın hesabı (banka) aracılığıyla yapılır.',
      },
    ],
    relatedSlugs: ['gram-altin', 'gumus', 'cumhuriyet-altini'],
  },

  'gremse-altin': {
    slug: 'gremse-altin',
    name: 'Gremse Altın',
    shortName: 'Gremse',
    purity: '22 ayar',
    weight: '17,5 gram',
    description:
      'Gremse altın, 2,5 tam altın büyüklüğünde özel basım altın sikkedir. 22 ayar olup yaklaşık 17,5 gram ağırlığındadır. Yüksek meblağlı yatırımlar ve özel hediyeler için tercih edilir.',
    faq: [
      {
        q: 'Gremse altın kaç tam altın eder?',
        a: 'Gremse altın yaklaşık 2,5 tam altın büyüklüğündedir. 17,5 gram ağırlığıyla Cumhuriyet altınının yaklaşık 2,4 katıdır.',
      },
    ],
    relatedSlugs: ['tam-altin', 'cumhuriyet-altini', 'ata-altin'],
  },

  bilezik: {
    slug: 'bilezik',
    name: 'Altın Bilezik',
    shortName: 'Bilezik',
    purity: '14 veya 22 ayar',
    description:
      'Altın bilezik, çeyrek, yarım ve tam bilezik olarak farklı gramajlarda üretilir. 14 ayar ve 22 ayar seçenekleri mevcuttur. Düğünlerde ve özel günlerde yaygın olarak hediye edilir.',
    faq: [
      {
        q: '22 ayar bilezik ile 14 ayar bilezik arasındaki fark nedir?',
        a: '22 ayar bilezik %91,6 saf altın içerirken, 14 ayar bilezik %58,5 saf altın içerir. 22 ayar bilezik daha değerli ve yumuşaktır.',
      },
      {
        q: 'Bilezik yatırım için uygun mu?',
        a: 'Bilezikler işçilik maliyeti içerdiğinden, gram altına göre daha yüksek alış-satış farkına sahiptir. Yatırım amaçlı gram altın veya sikke altınlar daha likittir.',
      },
    ],
    relatedSlugs: ['gram-altin', 'ceyrek-altin'],
  },

  gumus: {
    slug: 'gumus',
    name: 'Gümüş',
    shortName: 'Gümüş',
    purity: 'Has gümüş (%99,9)',
    description:
      'Gümüş, altın gibi değerli metal olup yatırım amaçlı alım-satımı yapılır. Endüstriyel kullanımı yaygındır. Gram gümüş fiyatı, ons gümüş fiyatı ve USD/TRY kuru üzerinden hesaplanır.',
    faq: [
      {
        q: 'Gümüş yatırım için uygun mu?',
        a: 'Gümüş, altına göre daha düşük fiyatlı ve daha volatildir. Küçük yatırımcılar için erişilebilir bir değerli metaldir.',
      },
    ],
    relatedSlugs: ['gram-altin', 'ons-altin'],
  },
};

// altinkaynak/Harem goldType → slug eşlemesi
export function goldTypeToSlug(goldType: string): string | null {
  const map: Record<string, string> = {
    'Gram Altın': 'gram-altin',
    'Çeyrek Altın': 'ceyrek-altin',
    'Eski Çeyrek Altın': 'ceyrek-altin',
    'Yarım Altın': 'yarim-altin',
    'Eski Yarım Altın': 'yarim-altin',
    'Tam Altın': 'tam-altin',
    'Eski Tam Altın': 'tam-altin',
    'Ata Altın': 'ata-altin',
    'Eski Ata Altın': 'ata-altin',
    'Cumhuriyet Altını': 'cumhuriyet-altini',
    'Ons Altın': 'ons-altin',
    'Gremse Altın': 'gremse-altin',
    'Eski Gremse Altın': 'gremse-altin',
    '14 Ayar Bilezik': 'bilezik',
    '22 Ayar Bilezik': 'bilezik',
    'Gram Gümüş': 'gumus',
  };
  return map[goldType] ?? null;
}

export function getGoldMeta(slug: string): GoldTypeMeta | null {
  return GOLD_META[slug] ?? null;
}

export const GOLD_SLUGS: string[] = Object.keys(GOLD_META);
