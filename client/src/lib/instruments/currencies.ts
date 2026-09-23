// ── Döviz kayıt defteri ──
// Canlı akıştaki adlar ve geçmiş veri anahtarları API'den doğrulandı (2026-09-24):
//  - serbest piyasa akışı: /api/market/currency/serbest-piyasa/stream  (1 birim başına)
//  - TCMB akışı:           /api/market/currency/merkez-bankasi/stream  (JPY 100 birim başına)
//  - geçmiş veri:          fx:<historyCode>:serbest-piyasa            (JPY100 = 100 yen)
// Bir kurun hangi kaynakta olmadığı null ile belirtilir; sayfa o kaynağı göstermez.

export interface CurrencyEntry {
  code: string;
  /** Türkçe adı (ekranda) */
  name: string;
  slug: string;
  country: string;
  /** Serbest piyasa akışındaki ad */
  serbestName: string | null;
  /** TCMB akışındaki ad */
  tcmbName: string | null;
  /** TCMB kotasyon birimi (JPY için 100) */
  tcmbUnit: number;
  /** Geçmiş veri anahtarı kodu; yoksa null (grafik gösterilmez) */
  historyCode: string | null;
  /** Geçmiş veri kotasyon birimi */
  historyUnit: number;
  /** Ana sayfalarda öne çıkan majör kur mu */
  major?: boolean;
}

const c = (e: Partial<CurrencyEntry> & Pick<CurrencyEntry, 'code' | 'name' | 'slug' | 'country'>): CurrencyEntry => ({
  serbestName: null,
  tcmbName: null,
  tcmbUnit: 1,
  historyCode: e.code,
  historyUnit: 1,
  ...e,
});

export const CURRENCIES: CurrencyEntry[] = [
  c({ code: 'USD', name: 'Amerikan Doları', slug: 'dolar', country: 'Amerika Birleşik Devletleri', serbestName: 'Amerikan Doları', tcmbName: 'ABD Doları', major: true }),
  c({ code: 'EUR', name: 'Euro', slug: 'euro', country: 'Avro Bölgesi', serbestName: 'Euro', tcmbName: 'Euro', major: true }),
  c({ code: 'GBP', name: 'İngiliz Sterlini', slug: 'sterlin', country: 'Birleşik Krallık', serbestName: 'İngiliz Sterlini', tcmbName: 'İngiliz Sterlini', major: true }),
  c({ code: 'CHF', name: 'İsviçre Frangı', slug: 'frang', country: 'İsviçre', serbestName: 'İsviçre Frankı', tcmbName: 'İsviçre Frangı', major: true }),
  c({ code: 'JPY', name: 'Japon Yeni', slug: 'yen', country: 'Japonya', serbestName: 'Japon Yeni', tcmbName: 'Japon Yeni', tcmbUnit: 100, historyCode: 'JPY100', historyUnit: 100, major: true }),
  c({ code: 'CNY', name: 'Çin Yuanı', slug: 'yuan', country: 'Çin', serbestName: 'Çin Yuanı', tcmbName: 'Çin Yuanı', major: true }),
  c({ code: 'RUB', name: 'Rus Rublesi', slug: 'ruble', country: 'Rusya', serbestName: 'Rus Rublesi', tcmbName: 'Rus Rublesi', major: true }),
  c({ code: 'AUD', name: 'Avustralya Doları', slug: 'avustralya-dolari', country: 'Avustralya', serbestName: 'Avustralya Doları', tcmbName: 'Avustralya Doları', major: true }),
  c({ code: 'CAD', name: 'Kanada Doları', slug: 'kanada-dolari', country: 'Kanada', serbestName: 'Kanada Doları', tcmbName: 'Kanada Doları', major: true }),
  c({ code: 'SAR', name: 'Suudi Arabistan Riyali', slug: 'suudi-riyali', country: 'Suudi Arabistan', serbestName: 'Suudi Riyali', tcmbName: 'Suudi Arabistan Riyali', historyCode: null, major: true }),
  c({ code: 'AED', name: 'BAE Dirhemi', slug: 'bae-dirhemi', country: 'Birleşik Arap Emirlikleri', serbestName: 'BAE Dirhemi', tcmbName: 'BAE Dirhemi' }),
  c({ code: 'KWD', name: 'Kuveyt Dinarı', slug: 'kuveyt-dinari', country: 'Kuveyt', serbestName: 'Kuveyt Dinarı', tcmbName: 'Kuveyt Dinarı' }),
  c({ code: 'QAR', name: 'Katar Riyali', slug: 'katar-riyali', country: 'Katar', serbestName: 'Katar Riyali', tcmbName: 'Katar Riyali' }),
  c({ code: 'SEK', name: 'İsveç Kronu', slug: 'isvec-kronu', country: 'İsveç', serbestName: 'İsveç Kronu', tcmbName: 'İsveç Kronu' }),
  c({ code: 'NOK', name: 'Norveç Kronu', slug: 'norvec-kronu', country: 'Norveç', serbestName: 'Norveç Kronu', tcmbName: 'Norveç Kronu' }),
  c({ code: 'DKK', name: 'Danimarka Kronu', slug: 'danimarka-kronu', country: 'Danimarka', serbestName: 'Danimarka Kronu', tcmbName: 'Danimarka Kronu' }),
  c({ code: 'BGN', name: 'Bulgar Levası', slug: 'bulgar-levasi', country: 'Bulgaristan', serbestName: 'Bulgar Levası', tcmbName: 'Bulgar Levası' }),
  c({ code: 'RON', name: 'Rumen Leyi', slug: 'rumen-leyi', country: 'Romanya', serbestName: 'Romanya Leyi', tcmbName: 'Rumen Leyi' }),
  c({ code: 'PKR', name: 'Pakistan Rupisi', slug: 'pakistan-rupisi', country: 'Pakistan', serbestName: 'Pakistan Rupisi', tcmbName: 'Pakistan Rupisi' }),
  c({ code: 'ZAR', name: 'Güney Afrika Randı', slug: 'guney-afrika-randi', country: 'Güney Afrika', serbestName: 'Güney Afrika Randı', tcmbName: 'Güney Afrika Randı' }),
  c({ code: 'BYN', name: 'Belarus Rublesi', slug: 'belarus-rublesi', country: 'Belarus', serbestName: 'Belarus Rublesi' }),
  c({ code: 'AZN', name: 'Azerbaycan Manatı', slug: 'azerbaycan-manati', country: 'Azerbaycan', tcmbName: 'Azerbaycan Manatı' }),
  c({ code: 'GEL', name: 'Gürcistan Larisi', slug: 'gurcistan-larisi', country: 'Gürcistan', tcmbName: 'Gürcistan Larisi' }),
  c({ code: 'KZT', name: 'Kazakistan Tengesi', slug: 'kazakistan-tengesi', country: 'Kazakistan', tcmbName: 'Kazakistan Tengesi' }),
  c({ code: 'UAH', name: 'Ukrayna Hryvnası', slug: 'ukrayna-hryvnasi', country: 'Ukrayna', tcmbName: 'Ukrayna Hryvnası' }),
  c({ code: 'PLN', name: 'Polonya Zlotisi', slug: 'polonya-zlotisi', country: 'Polonya', tcmbName: 'Polonya Zlotisi' }),
  c({ code: 'CZK', name: 'Çek Korunası', slug: 'cek-korunasi', country: 'Çekya', tcmbName: 'Çek Korunası' }),
  c({ code: 'HUF', name: 'Macar Forinti', slug: 'macar-forinti', country: 'Macaristan', tcmbName: 'Macar Forinti' }),
  c({ code: 'RSD', name: 'Sırp Dinarı', slug: 'sirp-dinari', country: 'Sırbistan', tcmbName: 'Sırp Dinarı' }),
  c({ code: 'BAM', name: 'Bosna Hersek Markı', slug: 'bosna-hersek-marki', country: 'Bosna-Hersek', tcmbName: 'Bosna Hersek Markı' }),
  c({ code: 'ALL', name: 'Arnavutluk Leki', slug: 'arnavutluk-leki', country: 'Arnavutluk', tcmbName: 'Arnavutluk Leki' }),
  c({ code: 'ISK', name: 'İzlanda Kronu', slug: 'izlanda-kronu', country: 'İzlanda', tcmbName: 'İzlanda Kronu' }),
  c({ code: 'ILS', name: 'İsrail Şekeli', slug: 'israil-sekeli', country: 'İsrail', tcmbName: 'Yeni İsrail Şekeli' }),
  c({ code: 'EGP', name: 'Mısır Lirası', slug: 'misir-lirasi', country: 'Mısır', tcmbName: 'Mısır Lirası' }),
  c({ code: 'IQD', name: 'Irak Dinarı', slug: 'irak-dinari', country: 'Irak', tcmbName: 'Irak Dinarı' }),
  c({ code: 'IRR', name: 'İran Riyali', slug: 'iran-riyali', country: 'İran', tcmbName: 'İran Riyali' }),
  c({ code: 'JOD', name: 'Ürdün Dinarı', slug: 'urdun-dinari', country: 'Ürdün', tcmbName: 'Ürdün Dinarı' }),
  c({ code: 'BHD', name: 'Bahreyn Dinarı', slug: 'bahreyn-dinari', country: 'Bahreyn', tcmbName: 'Bahreyn Dinarı' }),
  c({ code: 'OMR', name: 'Umman Riyali', slug: 'umman-riyali', country: 'Umman', tcmbName: 'Umman Riyali' }),
  c({ code: 'MAD', name: 'Fas Dirhemi', slug: 'fas-dirhemi', country: 'Fas', tcmbName: 'Fas Dirhemi' }),
  c({ code: 'TND', name: 'Tunus Dinarı', slug: 'tunus-dinari', country: 'Tunus', tcmbName: 'Tunus Dinarı' }),
  c({ code: 'DZD', name: 'Cezayir Dinarı', slug: 'cezayir-dinari', country: 'Cezayir', tcmbName: 'Cezayir Dinarı' }),
  c({ code: 'INR', name: 'Hindistan Rupisi', slug: 'hindistan-rupisi', country: 'Hindistan', tcmbName: 'Hindistan Rupisi' }),
  c({ code: 'HKD', name: 'Hong Kong Doları', slug: 'hong-kong-dolari', country: 'Hong Kong', tcmbName: 'Hong Kong Doları' }),
  c({ code: 'SGD', name: 'Singapur Doları', slug: 'singapur-dolari', country: 'Singapur', tcmbName: 'Singapur Doları' }),
  c({ code: 'KRW', name: 'Güney Kore Wonu', slug: 'guney-kore-wonu', country: 'Güney Kore', tcmbName: 'Güney Kore Wonu' }),
  c({ code: 'TWD', name: 'Yeni Tayvan Doları', slug: 'tayvan-dolari', country: 'Tayvan', tcmbName: 'Yeni Tayvan Doları' }),
  c({ code: 'THB', name: 'Tayland Bahtı', slug: 'tayland-bahti', country: 'Tayland', tcmbName: 'Tayland Bahtı' }),
  c({ code: 'MYR', name: 'Malezya Ringgiti', slug: 'malezya-ringgiti', country: 'Malezya', tcmbName: 'Malezya Ringgiti' }),
  c({ code: 'PHP', name: 'Filipin Pesosu', slug: 'filipin-pesosu', country: 'Filipinler', tcmbName: 'Filipin Pesosu' }),
  c({ code: 'NZD', name: 'Yeni Zelanda Doları', slug: 'yeni-zelanda-dolari', country: 'Yeni Zelanda', tcmbName: 'Yeni Zelanda Doları' }),
  c({ code: 'BRL', name: 'Brezilya Reali', slug: 'brezilya-reali', country: 'Brezilya', tcmbName: 'Brezilya Reali' }),
  c({ code: 'MXN', name: 'Meksika Pesosu', slug: 'meksika-pesosu', country: 'Meksika', tcmbName: 'Meksika Pesosu' }),
  c({ code: 'ARS', name: 'Arjantin Pesosu', slug: 'arjantin-pesosu', country: 'Arjantin', tcmbName: 'Arjantin Pesosu' }),
];

export const CURRENCY_BY_SLUG: Record<string, CurrencyEntry> = Object.fromEntries(CURRENCIES.map((c) => [c.slug, c]));
export const CURRENCY_BY_CODE: Record<string, CurrencyEntry> = Object.fromEntries(CURRENCIES.map((c) => [c.code, c]));

export function currencyHistoryKey(e: CurrencyEntry): string | null {
  return e.historyCode ? `fx:${e.historyCode}:serbest-piyasa` : null;
}
