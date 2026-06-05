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
  // ── BIST 100 Tam Liste — Yüksek hacimli ek hisseler ──
  ADEL: {
    symbol: 'ADEL',
    name: 'Adel Kalemcilik',
    sector: 'Tüketim',
    description:
      'ADEL (Adel Kalemcilik) hisse senedi canlı fiyat. Adel, Türkiye\'nin en köklü kırtasiye ve kırtasiye malzemeleri üreticisidir.',
  },
  AKCNS: {
    symbol: 'AKCNS',
    name: 'Akçansa Çimento',
    sector: 'Çimento',
    description:
      'AKCNS (Akçansa) hisse senedi canlı fiyat. Akçansa, Türkiye\'nin en büyük çimento üreticilerinden biridir. Sabancı ve Heidelberg ortaklığıdır.',
  },
  AKSEN: {
    symbol: 'AKSEN',
    name: 'Aksa Enerji',
    sector: 'Enerji',
    description:
      'AKSEN (Aksa Enerji) hisse senedi canlı fiyat. Aksa Enerji, Türkiye\'nin önde gelen özel sektör elektrik üreticilerindendir.',
  },
  ARDYZ: {
    symbol: 'ARDYZ',
    name: 'ARD Bilişim',
    sector: 'Teknoloji',
    description:
      'ARDYZ (ARD Bilişim) hisse senedi canlı fiyat. ARD Bilişim, kurumsal yazılım ve dijital dönüşüm çözümleri sunar.',
  },
  BAGFS: {
    symbol: 'BAGFS',
    name: 'Bagfaş',
    sector: 'Gübre',
    description:
      'BAGFS (Bagfaş) hisse senedi canlı fiyat. Bagfaş, Türkiye\'nin öncü gübre üreticilerinden biridir.',
  },
  BLCYT: {
    symbol: 'BLCYT',
    name: 'Bilçi Yatırım',
    sector: 'Yatırım',
    description:
      'BLCYT (Bilçi Yatırım) hisse senedi canlı fiyat. Bilçi, yatırım ortaklığı alanında faaliyet gösteren bir portföy yönetim şirketidir.',
  },
  BRSAN: {
    symbol: 'BRSAN',
    name: 'Borusan Mannesmann',
    sector: 'Metal Ana',
    description:
      'BRSAN (Borusan Mannesmann) hisse senedi canlı fiyat. Borusan Mannesmann, Türkiye\'nin en büyük çelik boru üreticisidir.',
  },
  CANTE: {
    symbol: 'CANTE',
    name: 'Çan2 Termik',
    sector: 'Enerji',
    description:
      'CANTE (Çan2 Termik) hisse senedi canlı fiyat. Çan2 Termik, Çanakkale\'de elektrik üretimi yapan bir termik santraldir.',
  },
  CIMSA: {
    symbol: 'CIMSA',
    name: 'Çimsa Çimento',
    sector: 'Çimento',
    description:
      'CIMSA (Çimsa) hisse senedi canlı fiyat. Çimsa, Türkiye\'nin en büyük gri çimento üreticilerinden biridir.',
  },
  DEVA: {
    symbol: 'DEVA',
    name: 'Deva Holding',
    sector: 'İlaç',
    description:
      'DEVA (Deva Holding) hisse senedi canlı fiyat. Deva, Türkiye\'nin önde gelen ilaç üreticilerinden biridir.',
  },
  EGEEN: {
    symbol: 'EGEEN',
    name: 'Ege Endüstri',
    sector: 'Otomotiv',
    description:
      'EGEEN (Ege Endüstri) hisse senedi canlı fiyat. Ege Endüstri, otomotiv yan sanayi ve tarım makineleri parçaları üretir.',
  },
  FORMT: {
    symbol: 'FORMT',
    name: 'Formet Çelik',
    sector: 'Metal Ana',
    description:
      'FORMT (Formet) hisse senedi canlı fiyat. Formet, demir-çelik sektöründe faaliyet gösteren bir sanayi şirketidir.',
  },
  GESAN: {
    symbol: 'GESAN',
    name: 'Girişim Elektrik',
    sector: 'Sanayi',
    description:
      'GESAN (Girişim Elektrik) hisse senedi canlı fiyat. Girişim Elektrik, orta ve yüksek gerilim elektrik teçhizatı üretir.',
  },
  INDES: {
    symbol: 'INDES',
    name: 'İndeks Bilgisayar',
    sector: 'Teknoloji',
    description:
      'INDES (İndeks Bilgisayar) hisse senedi canlı fiyat. İndeks, bilişim teknolojileri dağıtım ve satış alanında faaliyet gösterir.',
  },
  IPEKE: {
    symbol: 'IPEKE',
    name: 'İpek Doğal Enerji',
    sector: 'Enerji',
    description:
      'IPEKE (İpek Doğal Enerji) hisse senedi canlı fiyat. İpek Doğal Enerji, doğalgaz ve petrol arama-üretim faaliyetlerinde bulunur.',
  },
  ISGYO: {
    symbol: 'ISGYO',
    name: 'İş GYO',
    sector: 'GYO',
    description:
      'ISGYO (İş Gayrimenkul Yatırım Ortaklığı) hisse senedi canlı fiyat. İş GYO, gayrimenkul yatırım ortaklığı alanında faaliyet gösterir.',
  },
  KAREL: {
    symbol: 'KAREL',
    name: 'Karel Elektronik',
    sector: 'Teknoloji',
    description:
      'KAREL (Karel Elektronik) hisse senedi canlı fiyat. Karel, telekomünikasyon ekipmanları üretiminde Türkiye\'nin önde gelen şirketlerindendir.',
  },
  KARTN: {
    symbol: 'KARTN',
    name: 'Kartonsan',
    sector: 'Sanayi',
    description:
      'KARTN (Kartonsan) hisse senedi canlı fiyat. Kartonsan, Türkiye\'nin en büyük karton ambalaj üreticilerinden biridir.',
  },
  KERVT: {
    symbol: 'KERVT',
    name: 'Kerevitaş',
    sector: 'Gıda',
    description:
      'KERVT (Kerevitaş) hisse senedi canlı fiyat. Kerevitaş, dondurulmuş gıda ve konserve üretiminde Türkiye\'nin öncülerindendir.',
  },
  KLGYO: {
    symbol: 'KLGYO',
    name: 'Kiler GYO',
    sector: 'GYO',
    description:
      'KLGYO (Kiler Gayrimenkul Yatırım Ortaklığı) hisse senedi canlı fiyat. Kiler GYO, gayrimenkul portföyü yönetimi alanında faaliyet gösterir.',
  },
  KORDS: {
    symbol: 'KORDS',
    name: 'Kordsa Teknik Tekstil',
    sector: 'Sanayi',
    description:
      'KORDS (Kordsa) hisse senedi canlı fiyat. Kordsa, lastik ve mekanik kauçuk kord bezi üretiminde dünya lideridir.',
  },
  MAVI: {
    symbol: 'MAVI',
    name: 'Mavi Giyim',
    sector: 'Perakende',
    description:
      'MAVI (Mavi Giyim) hisse senedi canlı fiyat. Mavi, Türkiye\'nin en büyük denim markası ve küresel bir hazır giyim şirketidir.',
  },
  MPARK: {
    symbol: 'MPARK',
    name: 'MLP Sağlık',
    sector: 'Sağlık',
    description:
      'MPARK (MLP Sağlık) hisse senedi canlı fiyat. MLP Sağlık, Medical Park ve Liv Hospital markalarıyla Türkiye\'nin en büyük özel hastane gruplarından biridir.',
  },
  MTRKS: {
    symbol: 'MTRKS',
    name: 'Matriks Bilgi Dağıtım',
    sector: 'Teknoloji',
    description:
      'MTRKS (Matriks) hisse senedi canlı fiyat. Matriks, finansal veri dağıtımı ve bilgi teknolojileri alanında faaliyet gösterir.',
  },
  NUHCM: {
    symbol: 'NUHCM',
    name: 'Nuh Çimento',
    sector: 'Çimento',
    description:
      'NUHCM (Nuh Çimento) hisse senedi canlı fiyat. Nuh Çimento, Türkiye\'nin köklü çimento üreticilerinden biridir.',
  },
  ORGE: {
    symbol: 'ORGE',
    name: 'Orge Enerji Elektrik',
    sector: 'Sanayi',
    description:
      'ORGE (Orge Enerji) hisse senedi canlı fiyat. Orge, elektrik taahhüt ve mühendislik alanında faaliyet gösterir.',
  },
  PETUN: {
    symbol: 'PETUN',
    name: 'Pınar Et ve Un',
    sector: 'Gıda',
    description:
      'PETUN (Pınar Et ve Un) hisse senedi canlı fiyat. Pınar, et ve unlu mamuller üreticisidir.',
  },
  PGSUS: {
    symbol: 'PGSUS',
    name: 'Pegasus',
    sector: 'Ulaştırma',
    description:
      'PGSUS (Pegasus Hava Yolları) hisse senedi canlı fiyat. Pegasus, Türkiye\'nin düşük maliyetli havayolu şirketidir.',
  },
  SARKY: {
    symbol: 'SARKY',
    name: 'Sarkuysan',
    sector: 'Metal Ana',
    description:
      'SARKY (Sarkuysan) hisse senedi canlı fiyat. Sarkuysan, Türkiye\'nin en büyük elektrolitik bakır tel üreticisidir.',
  },
  SMRTG: {
    symbol: 'SMRTG',
    name: 'Smart Güneş Enerjisi',
    sector: 'Enerji',
    description:
      'SMRTG (Smart Güneş) hisse senedi canlı fiyat. Smart Güneş, güneş enerjisi panel ve ekipmanları üreticisidir.',
  },
  TATGD: {
    symbol: 'TATGD',
    name: 'Tat Gıda',
    sector: 'Gıda',
    description:
      'TATGD (Tat Gıda) hisse senedi canlı fiyat. Tat Gıda, salça, ketçap ve konserve ürünleri üreticisidir.',
  },
  TBORG: {
    symbol: 'TBORG',
    name: 'T-Bank Bonosu',
    sector: 'Bankacılık',
    description:
      'TBORG (Türkiye İş Bankası Bonosu) hisse senedi canlı fiyat. Bankacılık sektörü tahvili.',
  },
  TMSN: {
    symbol: 'TMSN',
    name: 'Tümosan Motor ve Traktör',
    sector: 'Sanayi',
    description:
      'TMSN (Tümosan) hisse senedi canlı fiyat. Tümosan, motor ve traktör üreticisidir.',
  },
  TRGYO: {
    symbol: 'TRGYO',
    name: 'Torunlar GYO',
    sector: 'GYO',
    description:
      'TRGYO (Torunlar GYO) hisse senedi canlı fiyat. Torunlar, gayrimenkul yatırım ortaklığı alanında faaliyet gösterir.',
  },
  TUCLK: {
    symbol: 'TUCLK',
    name: 'Tuğçelik',
    sector: 'Metal Ana',
    description:
      'TUCLK (Tuğçelik) hisse senedi canlı fiyat. Tuğçelik, demir-çelik ürünleri üreticisidir.',
  },
  TURSG: {
    symbol: 'TURSG',
    name: 'Türkiye Sigorta',
    sector: 'Sigorta',
    description:
      'TURSG (Türkiye Sigorta) hisse senedi canlı fiyat. Türkiye Sigorta, kamu bankalarına bağlı sigorta şirketidir.',
  },
  VESBE: {
    symbol: 'VESBE',
    name: 'Vestel Beyaz Eşya',
    sector: 'Dayanıklı Tüketim',
    description:
      'VESBE (Vestel Beyaz Eşya) hisse senedi canlı fiyat. Vestel Beyaz Eşya, Zorlu Holding bünyesinde buzdolabı, çamaşır makinesi üretir.',
  },
  YATAS: {
    symbol: 'YATAS',
    name: 'Yataş',
    sector: 'Dayanıklı Tüketim',
    description:
      'YATAS (Yataş) hisse senedi canlı fiyat. Yataş, yatak, mobilya ve ev tekstili üreticisidir.',
  },
  YEOTK: {
    symbol: 'YEOTK',
    name: 'Yeo Teknoloji',
    sector: 'Enerji',
    description:
      'YEOTK (Yeo Teknoloji) hisse senedi canlı fiyat. Yeo Teknoloji, enerji ve mühendislik projeleri yürütür.',
  },
  ZOREN: {
    symbol: 'ZOREN',
    name: 'Zorlu Enerji',
    sector: 'Enerji',
    description:
      'ZOREN (Zorlu Enerji) hisse senedi canlı fiyat. Zorlu Enerji, elektrik üretimi, dağıtımı ve satışı yapar.',
  },
  // ── Ek 7 hisse (BIST 100 dışı ama yüksek hacimli) ──
  ARASE: {
    symbol: 'ARASE',
    name: 'Doğu Aras Enerji',
    sector: 'Enerji',
    description:
      'ARASE (Aras Enerji) hisse senedi canlı fiyat. Aras, Türkiye\'nin önde gelen elektrik dağıtım şirketlerinden biridir.',
  },
  CLEBI: {
    symbol: 'CLEBI',
    name: 'Çelebi Hava Servisi',
    sector: 'Ulaştırma',
    description:
      'CLEBI (Çelebi Hava Servisi) hisse senedi canlı fiyat. Çelebi, havalimanı yer hizmetleri alanında faaliyet gösterir.',
  },
  ECZYT: {
    symbol: 'ECZYT',
    name: 'Eczacıbaşı Yatırım',
    sector: 'Yatırım',
    description:
      'ECZYT (Eczacıbaşı Yatırım) hisse senedi canlı fiyat. Eczacıbaşı Yatırım, portföy yönetimi ve yatırım alanında faaliyet gösterir.',
  },
  KLMSN: {
    symbol: 'KLMSN',
    name: 'Klimasan Klima',
    sector: 'Dayanıklı Tüketim',
    description:
      'KLMSN (Klimasan) hisse senedi canlı fiyat. Klimasan, klima ve havalandırma ekipmanları üreticisidir.',
  },
  KONKA: {
    symbol: 'KONKA',
    name: 'Konka Teknoloji',
    sector: 'Teknoloji',
    description:
      'KONKA (Konka) hisse senedi canlı fiyat. Konka, tüketici elektroniği ve beyaz eşya üreticisidir.',
  },
  KAPLM: {
    symbol: 'KAPLM',
    name: 'Kaplamin',
    sector: 'Sanayi',
    description:
      'KAPLM (Kaplamin) hisse senedi canlı fiyat. Kaplamin, karton laminasyon alanında faaliyet gösterir.',
  },
  PAPIL: {
    symbol: 'PAPIL',
    name: 'Papilon Savunma',
    sector: 'Savunma',
    description:
      'PAPIL (Papilon Savunma) hisse senedi canlı fiyat. Papilon, savunma sanayi alanında güvenlik çözümleri sunar.',
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
