/**
 * Borsa İstanbul verisinin dışarıya açılıp açılmayacağı.
 *
 * Varsayılan KAPALI: hisse/endeks uçları 404 döner, Swagger'da listelenmez,
 * birleşik piyasa akışında borsa kanalı yoktur ve geçmiş veri uçları BIST
 * enstrümanlarını (bist:*, BIST endeksleri) vermez. Kod yerinde duruyor;
 * geri açmak için MARKET_BORSA_ENABLED=true.
 */
export const BORSA_ENABLED = process.env['MARKET_BORSA_ENABLED'] === 'true';

/** Borsa İstanbul'a ait olmayan (yabancı/küresel) endeksler — bunlar açık kalır */
const NON_BIST_INDICES = new Set([
  'CAC40',
  'DAX40',
  'DOLARENDEKSI',
  'DOWJONESENDEKSI',
  'FTSE100',
  'FTSEMIB40',
  'HANGSENGENDEKSI',
  'IBEX35',
  'NASDAQ100ENDEKSI',
  'NIKKEI225ENDEKSI',
  'RUSSEL2000ENDEKSI',
  'SP500ENDEKS',
]);

/** Enstrüman anahtarı Borsa İstanbul verisi mi? (bist:THYAO, index:XU100, index:KATILIM30 …) */
export function isBorsaIstanbulInstrument(key: string): boolean {
  const k = String(key ?? '').trim();
  if (/^bist:/i.test(k)) return true;
  const m = /^index:(.+)$/i.exec(k);
  return !!m && !NON_BIST_INDICES.has(m[1].toUpperCase());
}
