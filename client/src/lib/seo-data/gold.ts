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
    name: '22 Ayar Bilezik',
    shortName: 'Bilezik',
    purity: '22 ayar (916 milyem)',
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

  'has-altin': {
    slug: 'has-altin',
    name: 'Has Altın',
    shortName: 'Has',
    purity: '24 ayar (995–999,9 milyem)',
    weight: '1 gram',
    description:
      'Has altın, 24 ayar saflıktaki altına verilen addır ve kuyumcu piyasasında gram bazında işlem görür. İçinde alaşım metali bulunmadığı için fiyatı doğrudan uluslararası altın fiyatı ve USD/TRY kuruyla hareket eder. Ziynet ve bilezik gibi işlenmiş ürünlerin fiyatları da has altın fiyatı referans alınarak belirlenir.',
    faq: [
      {
        q: 'Has altın ile gram altın aynı şey mi?',
        a: 'İkisi de 24 ayar saf altındır. Gram altın genellikle paketli külçe veya kart altın olarak satılırken, has altın ifadesi kuyumcu piyasasında saflık derecesini belirtmek için kullanılır. Fiyatları birbirine çok yakındır.',
      },
      {
        q: 'Has altın kaç ayardır?',
        a: 'Has altın 24 ayardır; milyem olarak 995 ile 999,9 arasında saflığa karşılık gelir.',
      },
    ],
    relatedSlugs: ['gram-altin', 'bilezik', 'ons-altin'],
  },

  'besli-altin': {
    slug: 'besli-altin',
    name: 'Beşli Altın',
    shortName: 'Beşli',
    purity: '22 ayar',
    weight: 'yaklaşık 36 gram',
    description:
      'Beşli altın, beş adet tam (lira) altın ağırlığına denk gelen 22 ayar ziynet altınıdır. Bir Cumhuriyet altını yaklaşık 7,216 gram olduğundan beşli altın yaklaşık 36 gram ağırlığındadır. Düğün ve özel günlerde takı olarak tercih edilir.',
    faq: [
      {
        q: 'Beşli altın kaç gramdır?',
        a: 'Beşli altın, beş tam altına denk gelir ve yaklaşık 36 gram ağırlığındadır (5 × 7,216 gram).',
      },
      {
        q: 'Beşli altın mı, beş adet tam altın mı?',
        a: 'Altın içeriği yakın olsa da beşli altın tek parça takı olarak basıldığı için işçilik ve alış-satış farkı farklı olabilir. Güncel alış ve satış fiyatlarını bu sayfada karşılaştırabilirsiniz.',
      },
    ],
    relatedSlugs: ['ikibucuk-altin', 'cumhuriyet-altini', 'tam-altin'],
  },

  'ikibucuk-altin': {
    slug: 'ikibucuk-altin',
    name: 'İkibuçuk Altın',
    shortName: 'İkibuçuk',
    purity: '22 ayar',
    weight: 'yaklaşık 18 gram',
    description:
      'İkibuçuk (2,5 luk) altın, iki buçuk tam altın ağırlığına denk gelen 22 ayar ziynet altınıdır. Yaklaşık 18 gram ağırlığındadır ve beşli altının yarısı kadardır.',
    faq: [
      {
        q: 'İkibuçuk altın kaç gramdır?',
        a: 'İkibuçuk altın, 2,5 tam altına denk gelir ve yaklaşık 18 gram ağırlığındadır (2,5 × 7,216 gram).',
      },
    ],
    relatedSlugs: ['besli-altin', 'gremse-altin', 'cumhuriyet-altini'],
  },

  'resat-altin': {
    slug: 'resat-altin',
    name: 'Reşat Altın',
    shortName: 'Reşat',
    purity: '22 ayar',
    weight: 'yaklaşık 7,2 gram',
    description:
      'Reşat altın, Osmanlı padişahı V. Mehmet Reşat dönemindeki sikke modeline göre basılan 22 ayar lira altınıdır. Tam altın ağırlığındadır ve süslü kenar işlemesiyle takı olarak da kullanılır.',
    faq: [
      {
        q: 'Reşat altın ile Cumhuriyet altını arasındaki fark nedir?',
        a: 'İkisi de 22 ayar ve tam altın ağırlığındadır. Fark basım modelinden gelir: Reşat altın Osmanlı sikke modeline, Cumhuriyet altını Cumhuriyet dönemi sikke modeline göre basılır. İşçilik ve talep farkı nedeniyle fiyatları ayrışabilir.',
      },
    ],
    relatedSlugs: ['hamit-altin', 'cumhuriyet-altini', 'ata-altin'],
  },

  'hamit-altin': {
    slug: 'hamit-altin',
    name: 'Hamit Altın',
    shortName: 'Hamit',
    purity: '22 ayar',
    weight: 'yaklaşık 7,2 gram',
    description:
      'Hamit altın, Osmanlı padişahı II. Abdülhamit dönemindeki sikke modeline göre basılan 22 ayar lira altınıdır. Tam altın ağırlığındadır; koleksiyon ve yatırım amaçlı alınıp satılır.',
    faq: [
      {
        q: 'Hamit altın kaç ayardır?',
        a: 'Hamit altın 22 ayardır ve tam altın ağırlığındadır (yaklaşık 7,2 gram).',
      },
    ],
    relatedSlugs: ['resat-altin', 'cumhuriyet-altini', 'ata-altin'],
  },

  '18-ayar-altin': {
    slug: '18-ayar-altin',
    name: '18 Ayar Altın',
    shortName: '18 Ayar',
    purity: '18 ayar (750 milyem)',
    weight: '1 gram',
    description:
      '18 ayar altın, ağırlığının %75\'i saf altın (750 milyem), kalanı alaşım metallerinden oluşan altındır. Pırlanta ve mücevher üretiminde yaygın olarak kullanılır. Fiyatı gram bazında verilir.',
    faq: [
      {
        q: '18 ayar altın yüzde kaç saf altındır?',
        a: '18 ayar altın %75 saf altın içerir (750 milyem).',
      },
    ],
    relatedSlugs: ['14-ayar-altin', 'bilezik', 'gram-altin'],
  },

  '14-ayar-altin': {
    slug: '14-ayar-altin',
    name: '14 Ayar Altın',
    shortName: '14 Ayar',
    purity: '14 ayar (585 milyem)',
    weight: '1 gram',
    description:
      '14 ayar altın, ağırlığının %58,5\'i saf altın (585 milyem) olan altındır. Sert ve dayanıklı olduğu için günlük takılarda sık kullanılır. Fiyatı gram bazında verilir.',
    faq: [
      {
        q: '14 ayar altın yüzde kaç saf altındır?',
        a: '14 ayar altın %58,5 saf altın içerir (585 milyem).',
      },
      {
        q: '14 ayar altın yatırım için uygun mu?',
        a: 'Takı olarak üretildiği için işçilik payı içerir ve alış-satış farkı yüksektir. Yatırım amacıyla genellikle gram altın veya 24 ayar ürünler tercih edilir.',
      },
    ],
    relatedSlugs: ['18-ayar-altin', 'bilezik', 'gram-altin'],
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
    '14 Ayar Bilezik': '14-ayar-altin',
    '18 Ayar Bilezik': '18-ayar-altin',
    '22 Ayar Bilezik': 'bilezik',
    'Gram Has Altın': 'has-altin',
    'Beşli Altın': 'besli-altin',
    'İkibuçuk Altın': 'ikibucuk-altin',
    'Reşat Altın': 'resat-altin',
    'Hamit Altın': 'hamit-altin',
    'Gram Gümüş': 'gumus',
  };
  return map[goldType] ?? null;
}

export function getGoldMeta(slug: string): GoldTypeMeta | null {
  return GOLD_META[slug] ?? null;
}

export const GOLD_SLUGS: string[] = Object.keys(GOLD_META);
