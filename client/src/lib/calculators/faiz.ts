// Faiz ve kredi hesapları: günlük faiz, oran dönüşümü, taksitten faiz oranı,
// kredi karşılaştırma, kredi kartı borcu kapatma süresi.

import { annuity, round2, solveMonotone } from './core.ts';

export interface GunlukFaizSonuc { brut: number; stopaj: number; net: number; gunlukNet: number; toplam: number }

/** Mevduat faizi: anapara × yıllık oran × gün / 365, getiriden stopaj kesilir. */
export function gunlukFaiz(anapara: number, yillikOran: number, gun: number, stopajOrani: number): GunlukFaizSonuc {
  const brut = round2((anapara * yillikOran * gun) / 365);
  const stopaj = round2(brut * stopajOrani);
  const net = round2(brut - stopaj);
  return { brut, stopaj, net, gunlukNet: gun > 0 ? round2(net / gun) : 0, toplam: round2(anapara + net) };
}

export type OranTuru = 'aylik' | 'yillikBasit' | 'yillikBilesik';

export interface OranDonusum { aylik: number; yillikBasit: number; yillikBilesik: number; gunluk: number }

/** Oranlar ondalık (0,03 = %3). Aylık bileşik esasına çevirip diğerlerini türetir. */
export function oranDonustur(deger: number, tur: OranTuru): OranDonusum {
  const aylik = tur === 'aylik' ? deger : tur === 'yillikBasit' ? deger / 12 : (1 + deger) ** (1 / 12) - 1;
  return { aylik, yillikBasit: aylik * 12, yillikBilesik: (1 + aylik) ** 12 - 1, gunluk: (aylik * 12) / 365 };
}

/** Kredi faizine eklenen vergi çarpanı: bireysel ihtiyaç/taşıt 1,30 (BSMV %15 + KKDF %15), konut 1. */
export type VergiTipi = 'bireysel' | 'konut' | 'yok';
export function vergiCarpani(tip: VergiTipi): number {
  return tip === 'bireysel' ? 1.3 : 1;
}

export interface KrediOranSonuc { aylikEfektif: number; aylikAkdi: number; yillikAkdi: number; yillikEfektif: number; toplamOdeme: number; toplamFaiz: number }

/**
 * Tutar, taksit ve vadeden aylık faiz oranını bulur: annuity(tutar, r, n) = taksit.
 * Bulunan oran vergiler dahil efektif orandır; akdi (bankanın ilan ettiği) oran = efektif / vergi çarpanı.
 */
export function taksittenFaizOrani(tutar: number, taksit: number, vade: number, tip: VergiTipi): KrediOranSonuc | null {
  if (!(taksit * vade > tutar)) return null;
  const r = solveMonotone((x) => annuity(tutar, x, vade), taksit, 1e-12, 2);
  if (!Number.isFinite(r)) return null;
  const aylikAkdi = r / vergiCarpani(tip);
  return {
    aylikEfektif: r, aylikAkdi, yillikAkdi: aylikAkdi * 12, yillikEfektif: (1 + r) ** 12 - 1,
    toplamOdeme: round2(taksit * vade), toplamFaiz: round2(taksit * vade - tutar),
  };
}

export interface KrediOzet { taksit: number; toplamOdeme: number; toplamFaiz: number; masraf: number; toplamMaliyet: number }

export function krediOzet(tutar: number, aylikAkdi: number, vade: number, tip: VergiTipi, masraf = 0): KrediOzet {
  const taksit = round2(annuity(tutar, aylikAkdi * vergiCarpani(tip), vade));
  const toplamOdeme = round2(taksit * vade);
  return { taksit, toplamOdeme, toplamFaiz: round2(toplamOdeme - tutar), masraf: round2(masraf), toplamMaliyet: round2(toplamOdeme - tutar + masraf) };
}

export interface KartSatiri { ay: number; faiz: number; vergi: number; odeme: number; kalan: number }
export interface KartSonuc { ay: number | null; toplamFaiz: number; toplamVergi: number; toplamOdeme: number; satirlar: KartSatiri[]; biterMi: boolean }

/**
 * Her ay kalan borca akdi faiz ve faiz üzerinden BSMV (%15) + KKDF (%15) işler, ardından
 * sabit ödeme düşülür. Ödeme aylık faiz + vergiyi karşılamıyorsa borç bitmez.
 */
export function kartBorcKapatma(borc: number, aylikFaiz: number, aylikOdeme: number): KartSonuc {
  const satirlar: KartSatiri[] = [];
  let kalan = borc;
  let toplamFaiz = 0;
  let toplamVergi = 0;
  let toplamOdeme = 0;
  const ilkFaiz = borc * aylikFaiz * 1.3;
  if (aylikOdeme <= ilkFaiz + 1e-9) return { ay: null, toplamFaiz: 0, toplamVergi: 0, toplamOdeme: 0, satirlar, biterMi: false };
  for (let ay = 1; ay <= 600 && kalan > 0.005; ay++) {
    const faiz = round2(kalan * aylikFaiz);
    const vergi = round2(faiz * 0.3);
    const borcBuAy = round2(kalan + faiz + vergi);
    const odeme = Math.min(aylikOdeme, borcBuAy);
    kalan = round2(borcBuAy - odeme);
    toplamFaiz += faiz;
    toplamVergi += vergi;
    toplamOdeme += odeme;
    satirlar.push({ ay, faiz, vergi, odeme: round2(odeme), kalan });
  }
  return { ay: satirlar.length, toplamFaiz: round2(toplamFaiz), toplamVergi: round2(toplamVergi), toplamOdeme: round2(toplamOdeme), satirlar, biterMi: kalan <= 0.005 };
}
