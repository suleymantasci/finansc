// ── Emtia kayıt defteri ──
// Veri: /api/history (canlidoviz / LBMA). Canlı akış yok; sayfalar son günlük
// kapanışı TARİHİYLE gösterir. Birimler son değerlerin büyüklüğü ve bilinen
// borsa kotasyonlarıyla doğrulandı (2026-09-24), ör. platin gram:
// 1837,9 USD/ons ÷ 31,1035 × 48,83 USD/TRY ≈ 2885 ₺/gram = API değeri.

export type CommodityGroup = 'enerji' | 'degerli-metal' | 'endustriyel-metal' | 'tarim';

export interface CommodityEntry {
  slug: string;
  name: string;
  shortName: string;
  group: CommodityGroup;
  historyKey: string;
  /** Kotasyon birimi — ekranda fiyatın yanında gösterilir */
  unit: string;
  /** Fiyatın para birimi (çevirici ve biçim için) */
  currency: 'USD' | 'USX' | 'TRY';
  decimals: number;
  /** Canlı altın akışında karşılığı varsa (ör. Gram Platin) */
  liveGoldName?: string;
  description: string;
  faq: { q: string; a: string }[];
}

export const COMMODITY_GROUP_LABELS: Record<CommodityGroup, string> = {
  enerji: 'Enerji',
  'degerli-metal': 'Değerli metaller',
  'endustriyel-metal': 'Endüstriyel metaller',
  tarim: 'Tarım ürünleri',
};

export const COMMODITIES: CommodityEntry[] = [
  {
    slug: 'brent-petrol',
    name: 'Brent Petrol',
    shortName: 'Brent',
    group: 'enerji',
    historyKey: 'commodity:brent-petrol',
    unit: 'USD/varil',
    currency: 'USD',
    decimals: 2,
    description:
      'Brent petrol, Kuzey Denizi kaynaklı ham petrolün uluslararası referans fiyatıdır. Avrupa, Afrika ve Orta Doğu petrolünün fiyatlanmasında gösterge olarak kullanılır ve varil (159 litre) başına ABD doları cinsinden kote edilir. Türkiye\'de akaryakıt fiyatlarını etkileyen başlıca göstergelerden biridir.',
    faq: [
      { q: 'Brent petrol fiyatı neyi gösterir?', a: 'Bir varil (yaklaşık 159 litre) Brent ham petrolün ABD doları cinsinden fiyatını gösterir. Uluslararası petrol ticaretinde en yaygın referans fiyattır.' },
      { q: 'Brent petrol akaryakıt fiyatlarını etkiler mi?', a: 'Evet. Türkiye\'de benzin ve motorin fiyatları; Akdeniz ürün fiyatları, döviz kuru ve vergilerle birlikte belirlenir. Brent petroldeki değişim bu ürün fiyatlarına genellikle gecikmeli yansır.' },
    ],
  },
  {
    slug: 'ham-petrol',
    name: 'Ham Petrol (WTI)',
    shortName: 'WTI',
    group: 'enerji',
    historyKey: 'commodity:ham-petrol',
    unit: 'USD/varil',
    currency: 'USD',
    decimals: 2,
    description:
      'WTI (West Texas Intermediate), ABD\'de üretilen hafif ve tatlı ham petrolün referans fiyatıdır. New York vadeli işlem piyasasında varil başına ABD doları cinsinden işlem görür ve Brent ile birlikte dünyanın iki ana petrol göstergesinden biridir.',
    faq: [
      { q: 'WTI ile Brent arasındaki fark nedir?', a: 'İkisi de ham petrol göstergesidir. WTI ABD kaynaklı, Brent Kuzey Denizi kaynaklı petrolü temsil eder. Kalite, taşıma ve arz koşulları nedeniyle aralarında genellikle fiyat farkı oluşur.' },
    ],
  },
  {
    slug: 'dogalgaz',
    name: 'Doğalgaz',
    shortName: 'Doğalgaz',
    group: 'enerji',
    historyKey: 'commodity:dogalgaz',
    unit: 'USD/MMBtu',
    currency: 'USD',
    decimals: 3,
    description:
      'Doğalgaz fiyatı, ABD Henry Hub teslim noktası referans alınarak milyon İngiliz ısı birimi (MMBtu) başına ABD doları cinsinden kote edilir. Mevsimsel talep, stok seviyeleri ve hava koşullarına duyarlı, oynaklığı yüksek bir emtiadır.',
    faq: [
      { q: 'MMBtu nedir?', a: 'MMBtu, bir milyon İngiliz ısı birimidir (British thermal unit). Doğalgaz enerji içeriğine göre bu birim üzerinden fiyatlanır.' },
    ],
  },
  {
    slug: 'gumus-ons',
    name: 'Ons Gümüş',
    shortName: 'Gümüş (ons)',
    group: 'degerli-metal',
    historyKey: 'commodity:gumus-ons',
    unit: 'USD/ons',
    currency: 'USD',
    decimals: 2,
    description:
      'Ons gümüş, uluslararası piyasada bir troy ons (31,1035 gram) gümüşün ABD doları cinsinden fiyatıdır. Hem değerli metal hem de elektronik ve güneş paneli gibi alanlarda endüstriyel hammadde olarak talep görür.',
    faq: [
      { q: 'Gram gümüş fiyatı nasıl hesaplanır?', a: 'Gram gümüş (TL) ≈ ons gümüş (USD) ÷ 31,1035 × USD/TRY kuru. Piyasada buna alış-satış farkı eklenir.' },
      { q: 'Altın/gümüş oranı nedir?', a: 'Bir ons altının kaç ons gümüş ettiğini gösteren orandır. Oran yükseldiğinde gümüş altına göre görece ucuzlamış demektir.' },
    ],
  },
  {
    slug: 'platin',
    name: 'Platin (ons)',
    shortName: 'Platin',
    group: 'degerli-metal',
    historyKey: 'commodity:platin-spot-dolar',
    unit: 'USD/ons',
    currency: 'USD',
    decimals: 2,
    description:
      'Platin, otomotiv katalitik konvertörleri, kimya sanayi ve mücevheratta kullanılan nadir bir değerli metaldir. Uluslararası piyasada troy ons başına ABD doları cinsinden spot fiyatla işlem görür.',
    faq: [
      { q: 'Platin fiyatını ne etkiler?', a: 'Otomotiv sektörü talebi, Güney Afrika ve Rusya\'daki üretim, endüstriyel talep ve yatırımcı ilgisi platin fiyatını etkileyen başlıca etkenlerdir.' },
    ],
  },
  {
    slug: 'gram-platin',
    name: 'Gram Platin',
    shortName: 'Gram platin',
    group: 'degerli-metal',
    historyKey: 'commodity:platin-gram',
    unit: '₺/gram',
    currency: 'TRY',
    decimals: 2,
    liveGoldName: 'Gram Platin',
    description:
      'Gram platin, bir gram platinin Türk lirası karşılığıdır. Ons platin fiyatının 31,1035\'e bölünüp USD/TRY kuruyla çarpılmasıyla hesaplanır.',
    faq: [
      { q: 'Gram platin nasıl hesaplanır?', a: 'Gram platin (TL) ≈ ons platin (USD) ÷ 31,1035 × USD/TRY kuru.' },
    ],
  },
  {
    slug: 'paladyum',
    name: 'Paladyum (ons)',
    shortName: 'Paladyum',
    group: 'degerli-metal',
    historyKey: 'commodity:paladyum-spot-dolar',
    unit: 'USD/ons',
    currency: 'USD',
    decimals: 2,
    description:
      'Paladyum, özellikle benzinli araçların katalitik konvertörlerinde kullanılan platin grubu bir metaldir. Troy ons başına ABD doları cinsinden spot fiyatla işlem görür.',
    faq: [
      { q: 'Paladyum nerede kullanılır?', a: 'En büyük kullanım alanı otomotiv katalitik konvertörleridir; elektronik, diş hekimliği ve mücevheratta da kullanılır.' },
    ],
  },
  {
    slug: 'altin-gumus-orani',
    name: 'Altın/Gümüş Oranı',
    shortName: 'Altın/Gümüş',
    group: 'degerli-metal',
    historyKey: 'gold:serbest-piyasa:altin-gumus',
    unit: 'oran',
    currency: 'USD',
    decimals: 2,
    description:
      'Altın/gümüş oranı, bir ons altın almak için kaç ons gümüş gerektiğini gösterir. Değerli metaller arasında göreli değer karşılaştırması için kullanılan bir göstergedir.',
    faq: [
      { q: 'Altın/gümüş oranı yükselirse ne anlama gelir?', a: 'Oranın yükselmesi, altının gümüşe göre görece daha pahalı hâle geldiğini gösterir.' },
    ],
  },
  {
    slug: 'bakir',
    name: 'Bakır',
    shortName: 'Bakır',
    group: 'endustriyel-metal',
    historyKey: 'commodity:bakir',
    unit: 'USD/libre',
    currency: 'USD',
    decimals: 4,
    description:
      'Bakır, elektrik iletkenliği nedeniyle inşaat, enerji altyapısı ve elektronikte yaygın kullanılan endüstriyel metaldir. ABD vadeli piyasasında libre (yaklaşık 0,4536 kg) başına ABD doları cinsinden kote edilir ve küresel ekonomik aktivitenin göstergelerinden biri kabul edilir.',
    faq: [
      { q: 'Bakır fiyatı neden ekonominin göstergesi sayılır?', a: 'Bakır inşaat ve sanayide çok yaygın kullanıldığı için talebi ekonomik büyümeyle birlikte hareket etme eğilimindedir.' },
      { q: 'Libre kaç kilogramdır?', a: '1 libre (pound) yaklaşık 0,4536 kilogramdır.' },
    ],
  },
  {
    slug: 'bugday',
    name: 'Buğday',
    shortName: 'Buğday',
    group: 'tarim',
    historyKey: 'commodity:bugday',
    unit: 'ABD senti/buşel',
    currency: 'USX',
    decimals: 2,
    description:
      'Buğday, Chicago vadeli işlem piyasasında buşel başına ABD senti cinsinden işlem gören temel tarım emtiasıdır. Hasat beklentileri, hava koşulları ve ihracat talebi fiyatını belirleyen başlıca etkenlerdir.',
    faq: [
      { q: 'Buşel nedir?', a: 'Buşel, tahıllar için kullanılan bir hacim birimidir; bir buşel buğday yaklaşık 27,2 kilogramdır.' },
    ],
  },
  {
    slug: 'misir',
    name: 'Mısır',
    shortName: 'Mısır',
    group: 'tarim',
    historyKey: 'commodity:misir',
    unit: 'ABD senti/buşel',
    currency: 'USX',
    decimals: 2,
    description:
      'Mısır, Chicago vadeli işlem piyasasında buşel başına ABD senti cinsinden işlem görür. Hayvan yemi, gıda ve biyoyakıt üretiminde kullanılır.',
    faq: [
      { q: 'Bir buşel mısır kaç kilogramdır?', a: 'Bir buşel mısır yaklaşık 25,4 kilogramdır.' },
    ],
  },
  {
    slug: 'soya-fasulyesi',
    name: 'Soya Fasulyesi',
    shortName: 'Soya',
    group: 'tarim',
    historyKey: 'commodity:soya-fasulyesi',
    unit: 'ABD senti/buşel',
    currency: 'USX',
    decimals: 2,
    description:
      'Soya fasulyesi, Chicago vadeli işlem piyasasında buşel başına ABD senti cinsinden işlem görür. Yağ ve yem sanayisinin temel hammaddelerindendir.',
    faq: [
      { q: 'Bir buşel soya fasulyesi kaç kilogramdır?', a: 'Bir buşel soya fasulyesi yaklaşık 27,2 kilogramdır.' },
    ],
  },
  {
    slug: 'kahve',
    name: 'Kahve',
    shortName: 'Kahve',
    group: 'tarim',
    historyKey: 'commodity:kahve',
    unit: 'ABD senti/libre',
    currency: 'USX',
    decimals: 2,
    description:
      'Kahve (Arabica) vadeli işlem piyasasında libre başına ABD senti cinsinden işlem görür. Brezilya ve Kolombiya gibi üretici ülkelerdeki hasat ve hava koşulları fiyatı belirgin şekilde etkiler.',
    faq: [
      { q: 'Kahve fiyatı hangi birimle verilir?', a: 'Libre (yaklaşık 0,4536 kg) başına ABD senti cinsinden verilir; 100 sent 1 ABD dolarıdır.' },
    ],
  },
  {
    slug: 'kakao',
    name: 'Kakao',
    shortName: 'Kakao',
    group: 'tarim',
    historyKey: 'commodity:kakao',
    unit: 'USD/ton',
    currency: 'USD',
    decimals: 0,
    description:
      'Kakao, vadeli işlem piyasasında metrik ton başına ABD doları cinsinden işlem görür. Üretimin büyük bölümü Batı Afrika\'da gerçekleştiği için bölgedeki hasat koşulları fiyatı belirler.',
    faq: [
      { q: 'Kakao fiyatları çikolata fiyatlarını etkiler mi?', a: 'Kakao çikolatanın ana hammaddesi olduğundan fiyat artışları üretici maliyetleri üzerinden genellikle gecikmeli olarak ürün fiyatlarına yansır.' },
    ],
  },
  {
    slug: 'seker',
    name: 'Şeker',
    shortName: 'Şeker',
    group: 'tarim',
    historyKey: 'commodity:seker',
    unit: 'ABD senti/libre',
    currency: 'USX',
    decimals: 2,
    description:
      'Ham şeker, vadeli işlem piyasasında libre başına ABD senti cinsinden işlem görür. Brezilya ve Hindistan üretimi ile etanol talebi fiyatını etkileyen başlıca unsurlardır.',
    faq: [
      { q: 'Şeker fiyatı hangi birimle verilir?', a: 'Libre (yaklaşık 0,4536 kg) başına ABD senti cinsinden verilir.' },
    ],
  },
  {
    slug: 'pamuk',
    name: 'Pamuk',
    shortName: 'Pamuk',
    group: 'tarim',
    historyKey: 'commodity:pamuk',
    unit: 'ABD senti/libre',
    currency: 'USX',
    decimals: 2,
    description:
      'Pamuk, vadeli işlem piyasasında libre başına ABD senti cinsinden işlem görür. Tekstil sektörünün temel hammaddesidir; Türkiye hem önemli bir üretici hem de tüketicidir.',
    faq: [
      { q: 'Pamuk fiyatını ne etkiler?', a: 'Üretici ülkelerdeki hasat, hava koşulları, tekstil talebi ve stok seviyeleri pamuk fiyatını etkiler.' },
    ],
  },
];

export const COMMODITY_BY_SLUG: Record<string, CommodityEntry> = Object.fromEntries(COMMODITIES.map((c) => [c.slug, c]));
