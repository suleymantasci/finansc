// Yatırım hesapları: ortalama maliyet, hisse ve altın kâr/zarar, pozisyon büyüklüğü,
// F/K ve PD/DD, ikiye katlanma süresi, altın ayarı.

import { ALTIN_MILYEM } from './params.ts';
import { round2 } from './core.ts';

/** Aracı kurum komisyonuna BSMV (%5) eklenir. */
export const KOMISYON_BSMV = 0.05;

export interface Alim { adet: number; fiyat: number }
export interface OrtalamaSonuc { toplamAdet: number; toplamTutar: number; komisyon: number; ortalama: number; guncelDeger: number | null; karZarar: number | null; getiri: number | null }

export function ortalamaMaliyet(alimlar: Alim[], komisyonBinde = 0, guncelFiyat: number | null = null): OrtalamaSonuc {
  const gecerli = alimlar.filter((a) => a.adet > 0 && a.fiyat >= 0);
  const toplamAdet = gecerli.reduce((s, a) => s + a.adet, 0);
  const brut = gecerli.reduce((s, a) => s + a.adet * a.fiyat, 0);
  const komisyon = round2(brut * (komisyonBinde / 1000) * (1 + KOMISYON_BSMV));
  const toplamTutar = round2(brut + komisyon);
  const ortalama = toplamAdet > 0 ? toplamTutar / toplamAdet : NaN;
  const guncelDeger = guncelFiyat != null && guncelFiyat > 0 ? round2(toplamAdet * guncelFiyat) : null;
  const karZarar = guncelDeger != null ? round2(guncelDeger - toplamTutar) : null;
  return { toplamAdet, toplamTutar, komisyon, ortalama, guncelDeger, karZarar, getiri: karZarar != null && toplamTutar > 0 ? (karZarar / toplamTutar) * 100 : null };
}

export interface HisseKzSonuc {
  alisTutari: number; alisKomisyon: number; toplamMaliyet: number;
  satisTutari: number; satisKomisyon: number; netSatis: number;
  karZarar: number; getiri: number; basabasFiyat: number;
}

export function hisseKarZarar(alis: number, satis: number, adet: number, komisyonBinde: number): HisseKzSonuc {
  const k = (komisyonBinde / 1000) * (1 + KOMISYON_BSMV);
  const alisTutari = round2(alis * adet);
  const alisKomisyon = round2(alisTutari * k);
  const toplamMaliyet = round2(alisTutari + alisKomisyon);
  const satisTutari = round2(satis * adet);
  const satisKomisyon = round2(satisTutari * k);
  const netSatis = round2(satisTutari - satisKomisyon);
  const karZarar = round2(netSatis - toplamMaliyet);
  return {
    alisTutari, alisKomisyon, toplamMaliyet, satisTutari, satisKomisyon, netSatis, karZarar,
    getiri: toplamMaliyet > 0 ? (karZarar / toplamMaliyet) * 100 : NaN,
    basabasFiyat: adet > 0 ? toplamMaliyet / (adet * (1 - k)) : NaN,
  };
}

export interface BasitKzSonuc { alisTutari: number; satisTutari: number; karZarar: number; getiri: number }

export function basitKarZarar(alisFiyat: number, satisFiyat: number, miktar: number): BasitKzSonuc {
  const alisTutari = round2(alisFiyat * miktar);
  const satisTutari = round2(satisFiyat * miktar);
  const karZarar = round2(satisTutari - alisTutari);
  return { alisTutari, satisTutari, karZarar, getiri: alisTutari > 0 ? (karZarar / alisTutari) * 100 : NaN };
}

export interface PozisyonSonuc { riskTutari: number; birimRisk: number; adet: number; pozisyonTutari: number; sermayeOrani: number; gercekRisk: number; odulRisk: number | null; hedefKar: number | null }

/** Adet = (sermaye × risk%) / |giriş − stop|, aşağı yuvarlanır. */
export function pozisyonBuyuklugu(sermaye: number, riskYuzde: number, giris: number, stop: number, hedef: number | null): PozisyonSonuc | null {
  const birimRisk = Math.abs(giris - stop);
  if (!(birimRisk > 0) || !(giris > 0)) return null;
  const riskTutari = round2((sermaye * riskYuzde) / 100);
  let adet = Math.floor(riskTutari / birimRisk + 1e-9);
  if (adet * giris > sermaye) adet = Math.floor(sermaye / giris);
  const odul = hedef != null && hedef > 0 ? Math.abs(hedef - giris) : null;
  return {
    riskTutari, birimRisk: round2(birimRisk), adet, pozisyonTutari: round2(adet * giris), sermayeOrani: sermaye > 0 ? (adet * giris * 100) / sermaye : 0,
    gercekRisk: round2(adet * birimRisk), odulRisk: odul != null ? odul / birimRisk : null, hedefKar: odul != null ? round2(odul * adet) : null,
  };
}

export interface CarpanSonuc { piyasaDegeri: number; hbk: number | null; fk: number | null; pddd: number | null; fkYil: number | null }

export function carpanlar(fiyat: number, hisseAdedi: number, netKar: number, ozkaynak: number | null): CarpanSonuc {
  const piyasaDegeri = round2(fiyat * hisseAdedi);
  const hbk = hisseAdedi > 0 ? netKar / hisseAdedi : null;
  const fk = netKar > 0 ? piyasaDegeri / netKar : null;
  return { piyasaDegeri, hbk, fk, pddd: ozkaynak && ozkaynak > 0 ? piyasaDegeri / ozkaynak : null, fkYil: fk };
}

export interface KatlanmaSonuc { kesin: number; kural72: number; ucKat: number }

export function ikiyeKatlanma(yillikOranYuzde: number): KatlanmaSonuc | null {
  if (!(yillikOranYuzde > 0)) return null;
  const r = yillikOranYuzde / 100;
  return { kesin: Math.log(2) / Math.log(1 + r), kural72: 72 / yillikOranYuzde, ucKat: Math.log(3) / Math.log(1 + r) };
}

export interface AyarSonuc { milyem: number; hasGram: number; deger: number | null }

export function altinAyar(gram: number, ayar: string, hasGramFiyat: number | null): AyarSonuc {
  const milyem = ALTIN_MILYEM[ayar] ?? NaN;
  const hasGram = gram * milyem;
  return { milyem, hasGram, deger: hasGramFiyat != null && hasGramFiyat > 0 ? round2(hasGram * hasGramFiyat) : null };
}
