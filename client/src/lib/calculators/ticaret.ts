// Ticaret ve yüzde hesapları: yüzde, indirim, kâr marjı, zam, başabaş, ROI,
// peşin mi taksit mi, fatura.

import { presentValueOfAnnuity, round2, solveMonotone } from './core.ts';

export type YuzdeModu = 'yuzdesi' | 'oran' | 'degisim' | 'ekle' | 'cikar';

/**
 * yuzdesi: A'nın %B'si · oran: A, B'nin yüzde kaçı · degisim: A'dan B'ye yüzde değişim ·
 * ekle: A'ya %B ekle · cikar: A'dan %B düş
 */
export function yuzde(mod: YuzdeModu, a: number, b: number): number {
  switch (mod) {
    case 'yuzdesi': return (a * b) / 100;
    case 'oran': return b === 0 ? NaN : (a / b) * 100;
    case 'degisim': return a === 0 ? NaN : ((b - a) / Math.abs(a)) * 100;
    case 'ekle': return a * (1 + b / 100);
    case 'cikar': return a * (1 - b / 100);
  }
}

export interface IndirimSonuc { indirimli: number; tasarruf: number; toplamOran: number }

/** Ardışık indirimler çarpılarak uygulanır: %20 + %10 = %28. */
export function indirim(fiyat: number, oranlar: number[]): IndirimSonuc {
  const carpan = oranlar.reduce((c, o) => c * (1 - o / 100), 1);
  const indirimli = round2(fiyat * carpan);
  return { indirimli, tasarruf: round2(fiyat - indirimli), toplamOran: (1 - carpan) * 100 };
}

export function indirimOrani(eski: number, yeni: number): number {
  return eski === 0 ? NaN : ((eski - yeni) / eski) * 100;
}

export interface KarSonuc { maliyet: number; satis: number; kar: number; marj: number; markup: number }

export function karMarji(maliyet: number, satis: number): KarSonuc {
  const kar = satis - maliyet;
  return { maliyet, satis, kar: round2(kar), marj: satis === 0 ? NaN : (kar / satis) * 100, markup: maliyet === 0 ? NaN : (kar / maliyet) * 100 };
}

/** Hedef brüt marja (satış üzerinden) göre satış fiyatı: maliyet / (1 − marj). */
export function marjdanSatis(maliyet: number, marjYuzde: number): number {
  return marjYuzde >= 100 ? NaN : round2(maliyet / (1 - marjYuzde / 100));
}

/** Maliyet üzerine kâr oranına (markup) göre satış fiyatı. */
export function markuptanSatis(maliyet: number, markupYuzde: number): number {
  return round2(maliyet * (1 + markupYuzde / 100));
}

export interface BasabasSonuc { adet: number; adetYuvarli: number; ciro: number; birimKatki: number; katkiOrani: number }

/** Başabaş adedi = (sabit gider + hedef kâr) / (birim fiyat − birim değişken maliyet). */
export function basabas(sabitGider: number, birimFiyat: number, birimDegisken: number, hedefKar = 0): BasabasSonuc | null {
  const birimKatki = birimFiyat - birimDegisken;
  if (!(birimKatki > 0)) return null;
  const adet = (sabitGider + hedefKar) / birimKatki;
  return { adet, adetYuvarli: Math.ceil(adet - 1e-9), ciro: round2(adet * birimFiyat), birimKatki: round2(birimKatki), katkiOrani: (birimKatki / birimFiyat) * 100 };
}

export interface RoiSonuc { kazanc: number; roi: number; yillik: number | null }

export function roi(yatirim: number, donus: number, yil: number): RoiSonuc {
  const kazanc = donus - yatirim;
  const r = yatirim === 0 ? NaN : kazanc / yatirim;
  const yillik = yil > 0 && yatirim > 0 && donus > 0 ? ((donus / yatirim) ** (1 / yil) - 1) * 100 : null;
  return { kazanc: round2(kazanc), roi: r * 100, yillik };
}

export interface PesinTaksitSonuc {
  taksitToplam: number;
  vadeFarki: number;
  bugunkuDeger: number;
  avantaj: 'pesin' | 'taksit' | 'esit';
  fark: number;
  zimniAylikFaiz: number | null;
}

/**
 * Taksitlerin bugünkü değeri, parayı değerlendirebileceğiniz aylık getiriyle indirgenir.
 * BD peşin fiyattan düşükse taksit avantajlı. Zımni faiz: peşin = BD(taksit, r) çözümü.
 * @param ilkTaksitBugun true ise ilk taksit bugün ödenir (peşin ödemeli taksit)
 */
export function pesinMiTaksit(pesin: number, taksit: number, n: number, aylikGetiri: number, ilkTaksitBugun = false): PesinTaksitSonuc {
  const pv = (r: number) => presentValueOfAnnuity(taksit, r, n) * (ilkTaksitBugun ? 1 + r : 1);
  const bugunkuDeger = round2(pv(aylikGetiri));
  const taksitToplam = round2(taksit * n);
  const fark = round2(pesin - bugunkuDeger);
  const avantaj = Math.abs(fark) < 0.01 ? 'esit' : fark > 0 ? 'taksit' : 'pesin';
  let zimni: number | null = null;
  if (taksitToplam > pesin) zimni = solveMonotone((r) => -pv(r), -pesin, 1e-9, 5);
  else if (taksitToplam === pesin) zimni = 0;
  return { taksitToplam, vadeFarki: round2(taksitToplam - pesin), bugunkuDeger, avantaj, fark, zimniAylikFaiz: zimni != null && Number.isFinite(zimni) ? zimni : null };
}

export interface FaturaSatiri { adet: number; birimFiyat: number; kdv: number; iskonto?: number }
export interface FaturaSonuc { araToplam: number; iskonto: number; matrah: number; kdvToplam: number; kdvDagilim: { oran: number; matrah: number; kdv: number }[]; genelToplam: number }

/** Satır bazında iskonto ve KDV; KDV oranına göre dağılım. */
export function fatura(satirlar: FaturaSatiri[]): FaturaSonuc {
  let araToplam = 0;
  let iskontoT = 0;
  const dagilim = new Map<number, { matrah: number; kdv: number }>();
  for (const s of satirlar) {
    const tutar = round2(s.adet * s.birimFiyat);
    const isk = round2((tutar * (s.iskonto ?? 0)) / 100);
    const matrah = tutar - isk;
    const kdv = round2((matrah * s.kdv) / 100);
    araToplam += tutar;
    iskontoT += isk;
    const d = dagilim.get(s.kdv) ?? { matrah: 0, kdv: 0 };
    d.matrah += matrah;
    d.kdv += kdv;
    dagilim.set(s.kdv, d);
  }
  const kdvDagilim = [...dagilim.entries()].sort((a, b) => a[0] - b[0]).map(([oran, d]) => ({ oran, matrah: round2(d.matrah), kdv: round2(d.kdv) }));
  const matrah = round2(araToplam - iskontoT);
  const kdvToplam = round2(kdvDagilim.reduce((a, d) => a + d.kdv, 0));
  return { araToplam: round2(araToplam), iskonto: round2(iskontoT), matrah, kdvToplam, kdvDagilim, genelToplam: round2(matrah + kdvToplam) };
}
