// ── BIST Hisse Sembolleri ve Şirket Bilgileri ──
// Programmatic SEO için statik veri. SEO title/desc üretiminde kullanılır.
// Yeni hisse eklemek için: sembol, ad, sektör, özet ekle.

export interface StockMeta {
  symbol: string;
  name: string;
  sector: string;
  description: string;
  faq?: { q: string; a: string }[];
}

export const STOCK_META: Record<string, StockMeta> = {
  // ── BIST 30 ──
  AEFES: {
    symbol: 'AEFES',
    name: 'Anadolu Efes',
    sector: 'İçecek',
    description:
      'AEFES (Anadolu Efes) hisse senedi canlı fiyat, günlük değişim, hacim ve teknik veriler. Anadolu Efes, Türkiye\'nin en büyük bira üreticisi ve Coca-Cola İçecek\'in ana ortağıdır.',
  },
  AKBNK: {
    symbol: 'AKBNK',
    name: 'Akbank',
    sector: 'Bankacılık',
    description:
      'AKBNK (Akbank) hisse senedi canlı fiyat ve analiz. Akbank, Türkiye\'nin önde gelen özel bankalarından biridir. BIST 30 ve BIST 100 endekslerinde işlem görür.',
  },
  ARCLK: {
    symbol: 'ARCLK',
    name: 'Arçelik',
    sector: 'Dayanıklı Tüketim',
    description:
      'ARCLK (Arçelik) hisse senedi canlı fiyat, hacim ve günlük değişim. Arçelik, Koç Holding\'e ait beyaz eşya ve elektronik markalarının üreticisidir.',
  },
  ASELS: {
    symbol: 'ASELS',
    name: 'Aselsan',
    sector: 'Savunma',
    description:
      'ASELS (Aselsan) hisse senedi canlı fiyat ve güncel veriler. Aselsan, Türkiye\'nin en büyük savunma sanayi şirketidir. BIST 30 endeksinde yer alır.',
  },
  BIMAS: {
    symbol: 'BIMAS',
    name: 'BİM Mağazalar',
    sector: 'Perakende',
    description:
      'BIMAS (BİM Mağazalar) hisse senedi canlı fiyat ve analiz. BİM, Türkiye\'nin en yaygın indirim market zinciridir. BIST 30 endeksinde işlem görür.',
  },
  EKGYO: {
    symbol: 'EKGYO',
    name: 'Emlak Konut GYO',
    sector: 'GYO',
    description:
      'EKGYO (Emlak Konut GYO) hisse senedi canlı fiyat ve veriler. Emlak Konut, Türkiye\'nin en büyük gayrimenkul yatırım ortaklığıdır.',
  },
  ENKAI: {
    symbol: 'ENKAI',
    name: 'Enka İnşaat',
    sector: 'İnşaat',
    description:
      'ENKAI (Enka İnşaat) hisse senedi canlı fiyat. Enka, Türkiye\'nin en büyük uluslararası müteahhitlik şirketidir. BIST 30 endeksinde yer alır.',
  },
  EREGL: {
    symbol: 'EREGL',
    name: 'Ereğli Demir Çelik',
    sector: 'Metal Ana',
    description:
      'EREGL (Ereğli Demir Çelik) hisse senedi canlı fiyat ve analiz. Ereğli Demir Çelik, Türkiye\'nin en büyük yassı çelik üreticisidir. OYAK Maden Metalürji Grubu bünyesindedir.',
  },
  FROTO: {
    symbol: 'FROTO',
    name: 'Ford Otosan',
    sector: 'Otomotiv',
    description:
      'FROTO (Ford Otosan) hisse senedi canlı fiyat. Ford Otosan, Koç Holding bünyesinde ticari ve binek araç üreticisidir. BIST 30 endeksinde işlem görür.',
  },
  GARAN: {
    symbol: 'GARAN',
    name: 'Garanti BBVA',
    sector: 'Bankacılık',
    description:
      'GARAN (Garanti BBVA) hisse senedi canlı fiyat ve analiz. Garanti BBVA, Türkiye\'nin en büyük özel bankalarından biridir. BIST 30 endeksinde yer alır.',
  },
  GUBRF: {
    symbol: 'GUBRF',
    name: 'Gübre Fabrikaları',
    sector: 'Kimya',
    description:
      'GUBRF (Gübre Fabrikaları) hisse senedi canlı fiyat. Gübre Fabrikaları, Türkiye\'nin en büyük gübre üreticisidir.',
  },
  HALKB: {
    symbol: 'HALKB',
    name: 'Halkbank',
    sector: 'Bankacılık',
    description:
      'HALKB (Halkbank) hisse senedi canlı fiyat ve güncel veriler. Türkiye Halk Bankası, devlet bankaları arasında yer alır.',
  },
  HEKTS: {
    symbol: 'HEKTS',
    name: 'Hektaş',
    sector: 'Kimya',
    description:
      'HEKTS (Hektaş) hisse senedi canlı fiyat. Hektaş, tarım ilaçları ve bitki besleme ürünleri üreticisidir. BIST 100 endeksinde işlem görür.',
  },
  ISCTR: {
    symbol: 'ISCTR',
    name: 'İş Bankası (C)',
    sector: 'Bankacılık',
    description:
      'ISCTR (İş Bankası) hisse senedi canlı fiyat ve analiz. Türkiye İş Bankası, Türkiye\'nin en büyük özel bankasıdır. BIST 30 endeksinde yer alır.',
  },
  KCHOL: {
    symbol: 'KCHOL',
    name: 'Koç Holding',
    sector: 'Holding',
    description:
      'KCHOL (Koç Holding) hisse senedi canlı fiyat ve güncel veriler. Koç Holding, Türkiye\'nin en büyük holding şirketidir. BIST 30 endeksinde işlem görür.',
  },
  KONTR: {
    symbol: 'KONTR',
    name: 'Kontrolmatik',
    sector: 'Teknoloji',
    description:
      'KONTR (Kontrolmatik) hisse senedi canlı fiyat. Kontrolmatik, enerji ve endüstriyel otomasyon alanında faaliyet gösteren teknoloji şirketidir.',
  },
  KOZAL: {
    symbol: 'KOZAL',
    name: 'Koza Altın',
    sector: 'Madencilik',
    description:
      'KOZAL (Koza Altın) hisse senedi canlı fiyat. Koza Altın, Türkiye\'nin en büyük altın üreticilerinden biridir.',
  },
  KOZAA: {
    symbol: 'KOZAA',
    name: 'Koza Madencilik',
    sector: 'Madencilik',
    description:
      'KOZAA (Koza Madencilik) hisse senedi canlı fiyat. Koza Madencilik, altın ve gümüş üretimi yapan madencilik şirketidir.',
  },
  KRDMD: {
    symbol: 'KRDMD',
    name: 'Kardemir (D)',
    sector: 'Metal Ana',
    description:
      'KRDMD (Kardemir) hisse senedi canlı fiyat. Kardemir, Türkiye\'nin en büyük demir çelik üreticilerinden biridir.',
  },
  MGROS: {
    symbol: 'MGROS',
    name: 'Migros',
    sector: 'Perakende',
    description:
      'MGROS (Migros) hisse senedi canlı fiyat ve analiz. Migros, Türkiye\'nin önde gelen perakende zincirlerinden biridir.',
  },
  ODAS: {
    symbol: 'ODAS',
    name: 'Odaş Elektrik',
    sector: 'Elektrik',
    description:
      'ODAS (Odaş Elektrik) hisse senedi canlı fiyat. Odaş Elektrik, elektrik üretimi ve madencilik alanında faaliyet gösterir.',
  },
  PETKM: {
    symbol: 'PETKM',
    name: 'Petkim',
    sector: 'Kimya',
    description:
      'PETKM (Petkim) hisse senedi canlı fiyat. Petkim, Türkiye\'nin en büyük petrokimya şirketidir.',
  },
  PGSUS: {
    symbol: 'PGSUS',
    name: 'Pegasus',
    sector: 'Ulaştırma',
    description:
      'PGSUS (Pegasus Hava Yolları) hisse senedi canlı fiyat. Pegasus, Türkiye\'nin en büyük düşük maliyetli havayolu şirketidir. BIST 30 endeksinde yer alır.',
  },
  SAHOL: {
    symbol: 'SAHOL',
    name: 'Sabancı Holding',
    sector: 'Holding',
    description:
      'SAHOL (Sabancı Holding) hisse senedi canlı fiyat. Sabancı Holding, Türkiye\'nin en büyük holding şirketlerinden biridir. BIST 30 endeksinde işlem görür.',
  },
  SASA: {
    symbol: 'SASA',
    name: 'Sasa Polyester',
    sector: 'Kimya',
    description:
      'SASA (Sasa Polyester) hisse senedi canlı fiyat. Sasa, Türkiye\'nin en büyük polyester üreticisidir.',
  },
  SISE: {
    symbol: 'SISE',
    name: 'Şişe Cam',
    sector: 'Cam',
    description:
      'SISE (Şişe Cam) hisse senedi canlı fiyat ve analiz. Türkiye Şişe ve Cam Fabrikaları, dünyanın en büyük cam üreticilerinden biridir. BIST 30 endeksinde yer alır.',
  },
  TAVHL: {
    symbol: 'TAVHL',
    name: 'TAV Havalimanları',
    sector: 'Ulaştırma',
    description:
      'TAVHL (TAV Havalimanları) hisse senedi canlı fiyat. TAV, Türkiye ve dünyada havalimanı işletmeciliği yapar.',
  },
  TCELL: {
    symbol: 'TCELL',
    name: 'Turkcell',
    sector: 'Telekomünikasyon',
    description:
      'TCELL (Turkcell) hisse senedi canlı fiyat ve analiz. Turkcell, Türkiye\'nin en büyük mobil operatörüdür. BIST 30 endeksinde işlem görür.',
  },
  THYAO: {
    symbol: 'THYAO',
    name: 'Türk Hava Yolları',
    sector: 'Ulaştırma',
    description:
      'THYAO (Türk Hava Yolları) hisse senedi canlı fiyat. Türk Hava Yolları, dünyanın en çok ülkesine uçan havayolu şirketidir. BIST 30 endeksinde yer alır.',
  },
  TKFEN: {
    symbol: 'TKFEN',
    name: 'Tekfen Holding',
    sector: 'İnşaat',
    description:
      'TKFEN (Tekfen Holding) hisse senedi canlı fiyat. Tekfen, inşaat ve mühendislik alanında faaliyet gösteren holdingtir.',
  },
  TOASO: {
    symbol: 'TOASO',
    name: 'Tofaş',
    sector: 'Otomotiv',
    description:
      'TOASO (Tofaş) hisse senedi canlı fiyat. Tofaş, Stellantis ve Koç Holding ortaklığında otomotiv üreticisidir.',
  },
  TUPRS: {
    symbol: 'TUPRS',
    name: 'Tüpraş',
    sector: 'Petrol',
    description:
      'TUPRS (Tüpraş) hisse senedi canlı fiyat ve analiz. Tüpraş, Türkiye\'nin en büyük rafineri şirketidir. BIST 30 endeksinde işlem görür.',
  },
  VAKBN: {
    symbol: 'VAKBN',
    name: 'Vakıfbank',
    sector: 'Bankacılık',
    description:
      'VAKBN (Vakıfbank) hisse senedi canlı fiyat. Türkiye Vakıflar Bankası, devlet bankaları arasında yer alır.',
  },
  VESTL: {
    symbol: 'VESTL',
    name: 'Vestel',
    sector: 'Dayanıklı Tüketim',
    description:
      'VESTL (Vestel) hisse senedi canlı fiyat. Vestel, Zorlu Holding bünyesinde elektronik üreticisidir.',
  },
  YKBNK: {
    symbol: 'YKBNK',
    name: 'Yapı Kredi',
    sector: 'Bankacılık',
    description:
      'YKBNK (Yapı Kredi Bankası) hisse senedi canlı fiyat. Yapı Kredi, Koç Holding ve UniCredit ortaklığında faaliyet gösteren özel bankadır.',
  },

  // ── BIST 100 - Ek önemli hisseler ──
  AGHOL: {
    symbol: 'AGHOL',
    name: 'Anadolu Grubu Holding',
    sector: 'Holding',
    description:
      'AGHOL (Anadolu Grubu Holding) hisse senedi canlı fiyat. Anadolu Grubu, Türkiye\'nin önde gelen holding şirketlerinden biridir.',
  },
  ALARK: {
    symbol: 'ALARK',
    name: 'Alarko Holding',
    sector: 'Holding',
    description:
      'ALARK (Alarko Holding) hisse senedi canlı fiyat. Alarko, inşaat, enerji ve sanayi alanlarında faaliyet gösterir.',
  },
  AYGAZ: {
    symbol: 'AYGAZ',
    name: 'Aygaz',
    sector: 'Enerji',
    description:
      'AYGAZ (Aygaz) hisse senedi canlı fiyat. Aygaz, Türkiye\'nin en büyük LPG dağıtım şirketidir. Koç Holding bünyesindedir.',
  },
  BERA: {
    symbol: 'BERA',
    name: 'Bera Holding',
    sector: 'Holding',
    description:
      'BERA (Bera Holding) hisse senedi canlı fiyat. Bera Holding, inşaat, enerji ve perakende alanlarında faaliyet gösterir.',
  },
  CCOLA: {
    symbol: 'CCOLA',
    name: 'Coca-Cola İçecek',
    sector: 'İçecek',
    description:
      'CCOLA (Coca-Cola İçecek) hisse senedi canlı fiyat. CCI, Coca-Cola ürünlerini 10\'dan fazla ülkede dağıtmaktadır.',
  },
  DOHOL: {
    symbol: 'DOHOL',
    name: 'Doğan Holding',
    sector: 'Holding',
    description:
      'DOHOL (Doğan Holding) hisse senedi canlı fiyat. Doğan Holding, medya, enerji ve sanayi alanlarında faaliyet gösterir.',
  },
  ECILC: {
    symbol: 'ECILC',
    name: 'Eczacıbaşı İlaç',
    sector: 'İlaç',
    description:
      'ECILC (Eczacıbaşı İlaç) hisse senedi canlı fiyat. Eczacıbaşı İlaç, Türkiye\'nin önde gelen ilaç şirketlerinden biridir.',
  },
  ENJSA: {
    symbol: 'ENJSA',
    name: 'Enerjisa Enerji',
    sector: 'Elektrik',
    description:
      'ENJSA (Enerjisa) hisse senedi canlı fiyat. Enerjisa, Türkiye\'nin en büyük elektrik dağıtım şirketlerinden biridir.',
  },
  LOGO: {
    symbol: 'LOGO',
    name: 'Logo Yazılım',
    sector: 'Yazılım',
    description:
      'LOGO (Logo Yazılım) hisse senedi canlı fiyat. Logo, Türkiye\'nin en büyük kurumsal yazılım şirketidir.',
  },
  NETAS: {
    symbol: 'NETAS',
    name: 'NETAŞ',
    sector: 'Teknoloji',
    description:
      'NETAS (NETAŞ) hisse senedi canlı fiyat. NETAŞ, telekomünikasyon ve bilgi teknolojileri alanında faaliyet gösterir.',
  },
  NTHOL: {
    symbol: 'NTHOL',
    name: 'Net Holding',
    sector: 'Holding',
    description:
      'NTHOL (Net Holding) hisse senedi canlı fiyat. Net Holding, turizm, medya ve finans alanlarında faaliyet gösterir.',
  },
  OASIS: {
    symbol: 'OASIS',
    name: 'Oasis Bodrum',
    sector: 'GYO',
    description:
      'OASIS hisse senedi canlı fiyat. Oasis, Bodrum\'da konut ve turizm yatırımları yapar.',
  },
  OTKAR: {
    symbol: 'OTKAR',
    name: 'Otokar',
    sector: 'Otomotiv',
    description:
      'OTKAR (Otokar) hisse senedi canlı fiyat. Otokar, Koç Holding bünyesinde ticari ve askeri araç üreticisidir.',
  },
  PARSN: {
    symbol: 'PARSN',
    name: 'Parsan',
    sector: 'Otomotiv Yan',
    description:
      'PARSN hisse senedi canlı fiyat. Parsan, otomotiv yan sanayi alanında faaliyet gösterir.',
  },
  QUAGR: {
    symbol: 'QUAGR',
    name: 'Qua Granite',
    sector: 'İnşaat',
    description:
      'QUAGR (Qua Granite) hisse senedi canlı fiyat. Qua, doğal taş ve seramik ürünleri üreticisidir.',
  },
  TKNSA: {
    symbol: 'TKNSA',
    name: 'Teknosa',
    sector: 'Perakende',
    description:
      'TKNSA (Teknosa) hisse senedi canlı fiyat. Teknosa, Türkiye\'nin en büyük teknoloji perakende zinciridir. Sabancı Holding bünyesindedir.',
  },
  TTKOM: {
    symbol: 'TTKOM',
    name: 'Türk Telekom',
    sector: 'Telekomünikasyon',
    description:
      'TTKOM (Türk Telekom) hisse senedi canlı fiyat. Türk Telekom, Türkiye\'nin öncül telekomünikasyon şirketidir.',
  },
  ULKER: {
    symbol: 'ULKER',
    name: 'Ülker Bisküvi',
    sector: 'Gıda',
    description:
      'ULKER (Ülker) hisse senedi canlı fiyat. Ülker, Türkiye\'nin en büyük gıda şirketlerinden biridir.',
  },
};

// Bilinmeyen sembol için fallback
export function getStockMeta(symbol: string): StockMeta {
  return (
    STOCK_META[symbol] ?? {
      symbol,
      name: symbol,
      sector: 'BIST',
      description: `${symbol} hisse senedi canlı fiyat, günlük değişim, hacim ve teknik veriler. ${symbol} Borsa İstanbul'da işlem görmektedir.`,
    }
  );
}
