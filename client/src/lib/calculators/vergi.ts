// Vergi hesapları: KDV, tevkifat, gelir vergisi, damga, stopaj, kira geliri,
// serbest meslek makbuzu, temettü, gecikme zammı, kanuni faiz.

import {
  DAMGA_AZAMI_2026, DAMGA_ORANLARI, GECIKME_ZAMMI_AYLIK, GELIR_VERGISI_TARIFESI, KANUNI_FAIZ_YILLIK,
  KONUT_KIRA_ISTISNASI, SON_GV_YILI, TEMETTU_STOPAJ_ORANI, type Bracket, type DatedValue, valueAt,
} from './params.ts';
import { addDays, addMonths, bracketTax, daysBetween, marginalRate, round2 } from './core.ts';

// ── KDV ─────────────────────────────────────────────────────────────────

export interface KdvSonuc { haric: number; kdv: number; dahil: number }

export function kdvHaricten(haric: number, oran: number): KdvSonuc {
  const kdv = round2(haric * oran);
  return { haric: round2(haric), kdv, dahil: round2(haric + kdv) };
}

export function kdvDahilden(dahil: number, oran: number): KdvSonuc {
  const haric = round2(dahil / (1 + oran));
  return { haric, kdv: round2(dahil - haric), dahil: round2(dahil) };
}

export interface TevkifatSonuc {
  matrah: number;
  kdv: number;
  tevkifEdilen: number;
  saticiyaKdv: number;
  faturaToplami: number;
  aliciOdemesi: number;
}

/** Tevkifat: alıcı, KDV'nin (pay/10)'unu satıcı yerine beyan edip öder. */
export function kdvTevkifati(matrah: number, oran: number, pay: number): TevkifatSonuc {
  const kdv = round2(matrah * oran);
  const tevkifEdilen = round2((kdv * pay) / 10);
  const saticiyaKdv = round2(kdv - tevkifEdilen);
  return {
    matrah: round2(matrah), kdv, tevkifEdilen, saticiyaKdv,
    faturaToplami: round2(matrah + kdv), aliciOdemesi: round2(matrah + saticiyaKdv),
  };
}

// ── Gelir vergisi ───────────────────────────────────────────────────────

export type GelirTuru = 'ucret' | 'ucretDisi';

export function tarife(yil: number, tur: GelirTuru): Bracket[] {
  return (GELIR_VERGISI_TARIFESI[yil] ?? GELIR_VERGISI_TARIFESI[SON_GV_YILI])[tur];
}

export interface DilimSatiri { alt: number; ust: number | null; oran: number; matrah: number; vergi: number }
export interface GelirVergisiSonuc {
  vergi: number;
  ortalamaOran: number;
  marjinalOran: number;
  dilimler: DilimSatiri[];
  net: number;
}

export function gelirVergisi(matrah: number, yil: number, tur: GelirTuru): GelirVergisiSonuc {
  const b = tarife(yil, tur);
  const dilimler: DilimSatiri[] = [];
  for (let i = 0; i < b.length; i++) {
    const alt = b[i].limit;
    const ust = i + 1 < b.length ? b[i + 1].limit : null;
    const pay = Math.max(0, Math.min(matrah, ust ?? Infinity) - alt);
    dilimler.push({ alt, ust, oran: b[i].rate, matrah: pay, vergi: round2(pay * b[i].rate) });
  }
  const vergi = round2(bracketTax(matrah, b));
  return {
    vergi, ortalamaOran: matrah > 0 ? vergi / matrah : 0, marjinalOran: matrah > 0 ? marginalRate(matrah, b) : 0,
    dilimler, net: round2(matrah - vergi),
  };
}

// ── Damga vergisi ───────────────────────────────────────────────────────

export type DamgaTuru = 'sozlesme' | 'kira' | 'ucret' | 'ozel';

export interface DamgaSonuc { matrah: number; oran: number; vergi: number; azamiUygulandi: boolean }

/**
 * Kira sözleşmesinde matrah = aylık kira × süre (ay). Nispi vergide kâğıt başına azami tutar
 * (2026: 29.115.961,10 TL) sözleşme ve kira türlerinde uygulanır.
 */
export function damgaVergisi(tur: DamgaTuru, tutar: number, ay = 12, ozelOranBinde = 0): DamgaSonuc {
  const oran = tur === 'ozel' ? ozelOranBinde / 1000 : DAMGA_ORANLARI[tur];
  const matrah = tur === 'kira' ? tutar * ay : tutar;
  let vergi = round2(matrah * oran);
  let azamiUygulandi = false;
  if (tur !== 'ucret' && vergi > DAMGA_AZAMI_2026) {
    vergi = DAMGA_AZAMI_2026;
    azamiUygulandi = true;
  }
  return { matrah: round2(matrah), oran, vergi, azamiUygulandi };
}

// ── Stopaj (brüt ↔ net) ─────────────────────────────────────────────────

export interface StopajSonuc { brut: number; stopaj: number; net: number }

export function stopajBruttenNete(brut: number, oran: number): StopajSonuc {
  const stopaj = round2(brut * oran);
  return { brut: round2(brut), stopaj, net: round2(brut - stopaj) };
}

export function stopajNettenBrute(net: number, oran: number): StopajSonuc {
  const brut = round2(net / (1 - oran));
  return { brut, stopaj: round2(brut - net), net: round2(net) };
}

// ── Serbest meslek makbuzu ──────────────────────────────────────────────

export interface SmmSonuc {
  brut: number;
  stopaj: number;
  netUcret: number;
  kdv: number;
  tahsilEdilecek: number;
}

export type SmmGiris = 'brut' | 'net' | 'tahsilat';

/**
 * Brüt ücret B: stopaj = B·s, KDV = B·k, net ücret = B − stopaj, tahsil edilecek = B − stopaj + KDV.
 * Net veya tahsil edilecek tutardan geriye doğru brüt bulunur.
 */
export function serbestMeslek(tutar: number, giris: SmmGiris, stopajOrani: number, kdvOrani: number): SmmSonuc {
  let brut = tutar;
  if (giris === 'net') brut = tutar / (1 - stopajOrani);
  if (giris === 'tahsilat') brut = tutar / (1 - stopajOrani + kdvOrani);
  brut = round2(brut);
  const stopaj = round2(brut * stopajOrani);
  const kdv = round2(brut * kdvOrani);
  return { brut, stopaj, netUcret: round2(brut - stopaj), kdv, tahsilEdilecek: round2(brut - stopaj + kdv) };
}

// ── Konut kira geliri vergisi ───────────────────────────────────────────

export interface KiraGeliriSonuc {
  istisna: number;
  vergiyeTabi: number;
  gider: number;
  matrah: number;
  vergi: number;
  beyanGerekli: boolean;
}

/**
 * Yıllık konut kira gelirinden istisna düşülür; kalan tutardan götürü (%15) ya da gerçek gider
 * (istisnaya isabet eden kısmı hariç) indirilir; matraha ücret dışı gelir tarifesi uygulanır.
 */
export function kiraGeliriVergisi(yillikKira: number, yil: number, istisnaVar: boolean, yontem: 'goturu' | 'gercek', gercekGider = 0): KiraGeliriSonuc {
  const istisnaTutari = KONUT_KIRA_ISTISNASI[yil] ?? KONUT_KIRA_ISTISNASI[SON_GV_YILI];
  const istisna = istisnaVar ? Math.min(yillikKira, istisnaTutari) : 0;
  const vergiyeTabi = yillikKira - istisna;
  let gider = 0;
  if (vergiyeTabi > 0) {
    gider = yontem === 'goturu' ? vergiyeTabi * 0.15 : yillikKira > 0 ? gercekGider * (vergiyeTabi / yillikKira) : 0;
  }
  gider = round2(Math.min(gider, vergiyeTabi));
  const matrah = round2(Math.max(0, vergiyeTabi - gider));
  const vergi = round2(bracketTax(matrah, tarife(yil, 'ucretDisi')));
  return { istisna: round2(istisna), vergiyeTabi: round2(vergiyeTabi), gider, matrah, vergi, beyanGerekli: vergiyeTabi > 0 };
}

// ── Temettü ─────────────────────────────────────────────────────────────

export interface TemettuSonuc { brut: number; stopaj: number; net: number; verim: number | null; netVerim: number | null }

export function temettu(adet: number, hisseBasiBrut: number, fiyat: number | null, stopajOrani = TEMETTU_STOPAJ_ORANI): TemettuSonuc {
  const brut = round2(adet * hisseBasiBrut);
  const stopaj = round2(brut * stopajOrani);
  const verim = fiyat && fiyat > 0 ? hisseBasiBrut / fiyat : null;
  return { brut, stopaj, net: round2(brut - stopaj), verim, netVerim: verim == null ? null : verim * (1 - stopajOrani) };
}

// ── Dönemsel faiz (gecikme zammı, kanuni faiz) ──────────────────────────

export interface DonemSatiri { baslangic: string; bitis: string; gun: number; ay: number; kalanGun: number; oran: number; tutar: number }

function donemlereBol(list: DatedValue<number>[], bas: string, bit: string): { bas: string; bit: string; oran: number }[] {
  const out: { bas: string; bit: string; oran: number }[] = [];
  let cur = bas;
  while (cur < bit) {
    const oran = valueAt(list, cur);
    const sonraki = list.find((x) => x.from > cur)?.from;
    const son = sonraki && sonraki < bit ? sonraki : bit;
    out.push({ bas: cur, bit: son, oran });
    cur = son;
  }
  return out;
}

export interface GecikmeSonuc { gun: number; zam: number; toplam: number; donemler: DonemSatiri[] }

/**
 * 6183 md. 51: vadeden ödeme tarihine kadar her tam ay için aylık oran, ay kesri için gün
 * hesabıyla (oran/30). Oran değişiminde süre dönemlere bölünür.
 */
export function gecikmeZammi(tutar: number, vade: string, odeme: string): GecikmeSonuc {
  const donemler: DonemSatiri[] = [];
  for (const d of donemlereBol(GECIKME_ZAMMI_AYLIK, vade, odeme)) {
    let ay = 0;
    while (addMonths(d.bas, ay + 1) <= d.bit) ay++;
    const kalanGun = daysBetween(addMonths(d.bas, ay), d.bit);
    const t = round2(tutar * (ay * d.oran + (kalanGun * d.oran) / 30));
    donemler.push({ baslangic: d.bas, bitis: d.bit, gun: daysBetween(d.bas, d.bit), ay, kalanGun, oran: d.oran, tutar: t });
  }
  const zam = round2(donemler.reduce((a, d) => a + d.tutar, 0));
  return { gun: Math.max(0, daysBetween(vade, odeme)), zam, toplam: round2(tutar + zam), donemler };
}

export interface FaizSonuc { gun: number; faiz: number; toplam: number; donemler: DonemSatiri[] }

/**
 * Basit faiz, 365 gün esası: tutar × oran × gün / 365. `sabitOran` verilmezse 3095 s. Kanun
 * kanuni faiz oranları dönemlerine göre uygulanır. Başlangıç günü dahil, bitiş günü hariç sayılır.
 */
export function donemselFaiz(tutar: number, baslangic: string, bitis: string, sabitOran?: number): FaizSonuc {
  const list: DatedValue<number>[] = sabitOran != null ? [{ from: '1900-01-01', value: sabitOran }] : KANUNI_FAIZ_YILLIK;
  const donemler: DonemSatiri[] = donemlereBol(list, baslangic, bitis).map((d) => {
    const gun = daysBetween(d.bas, d.bit);
    return { baslangic: d.bas, bitis: d.bit, gun, ay: 0, kalanGun: gun, oran: d.oran, tutar: round2((tutar * d.oran * gun) / 365) };
  });
  const faiz = round2(donemler.reduce((a, d) => a + d.tutar, 0));
  return { gun: Math.max(0, daysBetween(baslangic, bitis)), faiz, toplam: round2(tutar + faiz), donemler };
}

/** Dönem satırlarını ekranda göstermek için bitişten bir gün geri alır (bitiş günü dahil gösterim). */
export function gosterimBitis(bitis: string): string {
  return addDays(bitis, -1);
}
