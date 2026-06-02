// ── BIST Endeksleri Statik Veri ──
// Programmatic SEO + structured data için.

export interface IndexMeta {
  symbol: string;
  name: string;
  fullName: string;
  description: string;
  // SEO için ek bilgiler
  companies?: string[]; // endekste yer alan başlıca şirketler
  faq: { q: string; a: string }[];
  relatedSymbols: string[];
}

export const INDEX_META: Record<string, IndexMeta> = {
  XU100: {
    symbol: 'XU100',
    name: 'BIST 100',
    fullName: 'Borsa İstanbul 100 Endeksi',
    description:
      'BIST 100 (XU100), Borsa İstanbul\'da işlem gören en yüksek piyasa değerine sahip 100 şirketin performansını ölçen ana endekstir. Türkiye\'nin en geniş pay piyasası endeksi olarak kabul edilir. BIST 100, yatırımcıların Türkiye borsasının genel performansını takip etmek için en sık başvurduğu gösterge.',
    companies: [
      'Turkcell', 'Türk Hava Yolları', 'Garanti BBVA', 'Akbank', 'BİM',
      'Sabancı Holding', 'Koç Holding', 'Ereğli Demir Çelik', 'Tüpraş', 'Şişe Cam',
    ],
    faq: [
      {
        q: 'BIST 100 nedir?',
        a: 'BIST 100 (XU100), Borsa İstanbul\'da işlem gören en yüksek piyasa değerine sahip 100 şirketin performansını ölçen bir pay piyasası endeksidir. Türkiye borsasının genel performansını yansıtır.',
      },
      {
        q: 'BIST 100 nasıl hesaplanır?',
        a: 'BIST 100, endekse dahil şirketlerin piyasa değerlerine göre ağırlıklandırılmasıyla hesaplanır. Borsa İstanbul tarafından yılda iki kez (Mart ve Eylül) yeniden bileşen ve ağırlık güncellemesi yapılır.',
      },
      {
        q: 'BIST 100 yükselirse ne olur?',
        a: 'BIST 100 endeksinin yükselmesi, borsada genel olarak alıcılı bir ortam olduğunu ve büyük şirketlerin değer kazandığını gösterir. Yatırımcı güveni artar, yabancı sermaye girişi hızlanabilir.',
      },
      {
        q: 'BIST 100\'e yatırım nasıl yapılır?',
        a: 'BIST 100 endeksine doğrudan yatırım yapılamaz. Bunun yerine BIST 100 endeksini takip eden yatırım fonlarına (ETF), borsa yatırım fonlarına veya endeksteki büyük şirketlerin hisselerine tek tek yatırım yapılabilir.',
      },
    ],
    relatedSymbols: ['XU030', 'XU050'],
  },

  XU030: {
    symbol: 'XU030',
    name: 'BIST 30',
    fullName: 'Borsa İstanbul 30 Endeksi',
    description:
      'BIST 30 (XU030), Borsa İstanbul\'da işlem gören en yüksek piyasa değerine ve işlem hacmine sahip 30 şirketin performansını ölçen endekstir. BIST 100\'ün en likit ve büyük 30 şirketinden oluşur. Vadeli işlem sözleşmelerinde (futures) en çok işlem gören endekstir.',
    companies: [
      'Akbank', 'Garanti BBVA', 'Türk Hava Yolları', 'Turkcell', 'Sabancı Holding',
      'Koç Holding', 'Tüpraş', 'BİM', 'Ereğli Demir Çelik', 'Şişe Cam',
    ],
    faq: [
      {
        q: 'BIST 30 nedir?',
        a: 'BIST 30 (XU030), Borsa İstanbul\'da en yüksek piyasa değerine sahip 30 şirketin performansını ölçen endekstir. BIST 100\'ün en likit ve büyük şirketlerini kapsar.',
      },
      {
        q: 'BIST 30 vadeli işlem nedir?',
        a: 'BIST 30 vadeli işlem sözleşmeleri (futures), yatırımcılara endeksin gelecekteki değeri üzerine pozisyon alma imkânı sunar. Kaldıraçlı işlem yapılabilir, ancak yüksek risk içerir.',
      },
      {
        q: 'BIST 30 mu BIST 100 mü daha iyi?',
        a: 'BIST 30 daha az sayıda ve daha büyük şirket içerdiğinden daha stabil kabul edilir. BIST 100 ise daha geniş kapsamlıdır. Yatırım tercihi risk iştahına ve stratejiye bağlıdır.',
      },
    ],
    relatedSymbols: ['XU100', 'XBANK'],
  },

  XU050: {
    symbol: 'XU050',
    name: 'BIST 50',
    fullName: 'Borsa İstanbul 50 Endeksi',
    description:
      'BIST 50 (XU050), Borsa İstanbul\'da işlem gören en yüksek piyasa değerine sahip 50 şirketin performansını ölçen endekstir. BIST 30 ile BIST 100 arasında bir genişliğe sahiptir.',
    companies: [
      'Akbank', 'Garanti BBVA', 'Türk Hava Yolları', 'Turkcell', 'Sabancı Holding',
      'Koç Holding', 'Tüpraş', 'BİM', 'Petkim', 'Tofaş',
    ],
    faq: [
      {
        q: 'BIST 50 nedir?',
        a: 'BIST 50 (XU050), Borsa İstanbul\'da en yüksek piyasa değerine sahip 50 şirketin performansını ölçen endekstir.',
      },
      {
        q: 'BIST 50\'ye nasıl yatırım yapılır?',
        a: 'BIST 50 endeksine doğrudan yatırım yapılamaz, ancak endeksi takip eden yatırım fonları veya endeksteki hisselere bireysel yatırım mümkündür.',
      },
    ],
    relatedSymbols: ['XU030', 'XU100'],
  },

  XBANK: {
    symbol: 'XBANK',
    name: 'BIST Banka',
    fullName: 'Borsa İstanbul Banka Endeksi',
    description:
      'BIST Banka (XBANK), Borsa İstanbul\'da işlem gören bankacılık sektörü şirketlerinin performansını ölçen sektör endeksidir. Türk bankacılık sisteminin genel sağlığını ve performansını yansıtır. Faiz oranları, enflasyon ve TCMB politikalarından doğrudan etkilenir.',
    companies: [
      'Akbank', 'Garanti BBVA', 'İş Bankası', 'Yapı Kredi', 'Halkbank',
      'Vakıfbank', 'Türkiye Garanti Bankası', 'Denizbank', 'QNB Finansbank',
    ],
    faq: [
      {
        q: 'BIST Banka endeksi nedir?',
        a: 'BIST Banka (XBANK), Borsa İstanbul\'da işlem gören bankacılık sektörü şirketlerinin performansını ölçen sektör endeksidir.',
      },
      {
        q: 'XBANK endeksini etkileyen faktörler nelerdir?',
        a: 'Faiz oranları, enflasyon, TCMB politikaları, kredi büyümesi, takipteki alacak oranı ve bankaların bilanço performansı XBANK endeksini doğrudan etkiler.',
      },
      {
        q: 'Banka endeksine yatırım nasıl yapılır?',
        a: 'BIST Banka endeksine yatırım için banka hisselerine doğrudan yatırım, bankacılık sektörü yatırım fonları veya banka ETF\'leri tercih edilebilir.',
      },
    ],
    relatedSymbols: ['XU100', 'XUTEK', 'XUMAL'],
  },

  XUTEK: {
    symbol: 'XUTEK',
    name: 'BIST Teknoloji',
    fullName: 'Borsa İstanbul Teknoloji Endeksi',
    description:
      'BIST Teknoloji (XUTEK), Borsa İstanbul\'da işlem gören teknoloji şirketlerinin performansını ölçen sektör endeksidir. Yazılım, donanım, siber güvenlik ve teknoloji hizmetleri şirketlerini kapsar. Türkiye\'nin dijital dönüşüm stratejisiyle birlikte önemi artan bir endekstir.',
    companies: ['Logo Yazılım', 'NETAŞ', 'Kontrolmatik', 'Datagate', 'Indeks Bilgisayar'],
    faq: [
      {
        q: 'BIST Teknoloji endeksi nedir?',
        a: 'BIST Teknoloji (XUTEK), Borsa İstanbul\'da işlem gören teknoloji şirketlerinin performansını ölçen sektör endeksidir.',
      },
      {
        q: 'XUTEK yükselir mi?',
        a: 'Türkiye\'nin dijitalleşme trendi, teknoloji ihracatı ve yazılım sektörü büyümesi XUTEK için olumlu faktörler. Ancak küresel teknoloji trendleri ve döviz kuru da etkili.',
      },
    ],
    relatedSymbols: ['XU100', 'XUMAL', 'XBANK'],
  },

  XUMAL: {
    symbol: 'XUMAL',
    name: 'BIST Mali',
    fullName: 'Borsa İstanbul Mali Endeksi',
    description:
      'BIST Mali (XUMAL), bankalar, sigorta şirketleri, finansal kiralama ve diğer mali kuruluşların performansını ölçen sektör endeksidir. BIST\'in en büyük sektör endekslerinden biridir ve banka, sigorta, holding bileşenlerini içerir.',
    companies: [
      'Akbank', 'Garanti BBVA', 'Sabancı Holding', 'Koç Holding',
      'Türkiye Sigorta', 'Anadolu Hayat Emeklilik',
    ],
    faq: [
      {
        q: 'BIST Mali endeksi nedir?',
        a: 'BIST Mali (XUMAL), bankalar, sigorta şirketleri ve diğer mali kuruluşların performansını ölçen sektör endeksidir.',
      },
      {
        q: 'XUMAL ile XBANK arasındaki fark nedir?',
        a: 'XUMAL sadece bankaları değil, tüm mali sektörü (sigorta, leasing vb.) kapsar. XBANK ise yalnızca bankacılık sektörünü içerir.',
      },
    ],
    relatedSymbols: ['XBANK', 'XU100'],
  },

  XUSIN: {
    symbol: 'XUSIN',
    name: 'BIST Sinai',
    fullName: 'Borsa İstanbul Sinai Endeksi',
    description:
      'BIST Sinai (XUSIN), Borsa İstanbul\'da işlem gören sanayi şirketlerinin performansını ölçen sektör endeksidir. Otomotiv, kimya, metal ana sanayi, tekstil ve gıda gibi alt sektörleri kapsar.',
    companies: [
      'Türk Hava Yolları', 'Ereğli Demir Çelik', 'Tüpraş', 'Ford Otosan', 'Tofaş',
      'Petkim', 'Arçelik', 'Vestel',
    ],
    faq: [
      {
        q: 'BIST Sinai endeksi nedir?',
        a: 'BIST Sinai (XUSIN), Borsa İstanbul\'da işlem gören sanayi şirketlerinin performansını ölçen sektör endeksidir.',
      },
    ],
    relatedSymbols: ['XU100', 'XBANK', 'XUTEK'],
  },

  XUHIZ: {
    symbol: 'XUHIZ',
    name: 'BIST Hizmetler',
    fullName: 'Borsa İstanbul Hizmetler Endeksi',
    description:
      'BIST Hizmetler (XUHIZ), Borsa İstanbul\'da işlem gören hizmet sektörü şirketlerinin performansını ölçen sektör endeksidir. Ulaştırma, turizm, perakende, iletişim ve sağlık gibi alt sektörleri kapsar.',
    companies: [
      'Türk Hava Yolları', 'Pegasus', 'TAV Havalimanları', 'Migros', 'Turkcell', 'Türk Telekom',
    ],
    faq: [
      {
        q: 'BIST Hizmetler endeksi nedir?',
        a: 'BIST Hizmetler (XUHIZ), Borsa İstanbul\'da hizmet sektöründe faaliyet gösteren şirketlerin performansını ölçen sektör endeksidir.',
      },
    ],
    relatedSymbols: ['XU100', 'XUTEK'],
  },
};

export const INDEX_SYMBOLS = Object.keys(INDEX_META);

// Bilinmeyen sembol için fallback
export function getIndexMeta(symbol: string): IndexMeta {
  return (
    INDEX_META[symbol] ?? {
      symbol,
      name: symbol,
      fullName: `${symbol} Endeksi`,
      description: `${symbol} Borsa İstanbul endeksidir. Canlı değer, günlük değişim ve detaylı bilgiler bu sayfada güncellenmektedir.`,
      faq: [
        {
          q: `${symbol} endeksi nedir?`,
          a: `${symbol}, Borsa İstanbul'da işlem gören bir endekstir. Detaylı bilgi için endeks tanımına bakılabilir.`,
        },
      ],
      relatedSymbols: ['XU100'],
    }
  );
}
