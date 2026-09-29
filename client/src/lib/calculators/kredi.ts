// Kredi ve kredi kartı hesapları (eşit taksitli ödeme planı, BSMV/KKDF, kart işlemleri).
//
// Vergiler faize eklenir: efektif aylık oran = akdi faiz × (1 + BSMV + KKDF). Eşit taksit bu
// efektif oranla bulunur; her ay faiz = kalan × akdi, BSMV ve KKDF faiz üzerinden, anapara = taksit − faiz − vergiler.

import { annuity, presentValueOfAnnuity, round2, solveMonotone } from './core.ts';

export interface Vergi { bsmv: number; kkdf: number }

/** Kredi türüne göre vergiler. Konut: kredi tarihinde üzerine kayıtlı konutu olmayana BSMV ve KKDF yok. */
export const KREDI_VERGI = {
  ihtiyac: { bsmv: 0.15, kkdf: 0.15 },
  tasit: { bsmv: 0.15, kkdf: 0.15 },
  konut: { bsmv: 0, kkdf: 0 },
  konutIkinci: { bsmv: 0.05, kkdf: 0 },
  ticari: { bsmv: 0.05, kkdf: 0 },
  kart: { bsmv: 0.15, kkdf: 0.15 },
} satisfies Record<string, Vergi>;

export type KrediTuru = keyof typeof KREDI_VERGI;

export interface PlanSatiri { ay: number; taksit: number; anapara: number; faiz: number; bsmv: number; kkdf: number; kalan: number }
export interface KrediPlani {
  taksit: number;
  satirlar: PlanSatiri[];
  toplamOdeme: number;
  toplamFaiz: number;
  toplamBsmv: number;
  toplamKkdf: number;
  /** Aylık maliyet oranı (vergiler dahil) */
  aylikMaliyet: number;
}

export function krediPlani(tutar: number, aylikFaiz: number, vade: number, v: Vergi): KrediPlani {
  const efektif = aylikFaiz * (1 + v.bsmv + v.kkdf);
  const taksit = annuity(tutar, efektif, vade);
  const satirlar: PlanSatiri[] = [];
  let kalan = tutar;
  let tf = 0, tb = 0, tk = 0;
  for (let ay = 1; ay <= vade; ay++) {
    const faiz = kalan * aylikFaiz;
    const bsmv = faiz * v.bsmv;
    const kkdf = faiz * v.kkdf;
    const anapara = taksit - faiz - bsmv - kkdf;
    kalan -= anapara;
    tf += faiz; tb += bsmv; tk += kkdf;
    satirlar.push({ ay, taksit: round2(taksit), anapara: round2(anapara), faiz: round2(faiz), bsmv: round2(bsmv), kkdf: round2(kkdf), kalan: round2(Math.max(0, kalan)) });
  }
  return {
    taksit: round2(taksit), satirlar, toplamOdeme: round2(taksit * vade), toplamFaiz: round2(tf),
    toplamBsmv: round2(tb), toplamKkdf: round2(tk), aylikMaliyet: efektif,
  };
}

/** n taksit ödendikten sonra kalan anapara */
export function kalanAnapara(tutar: number, aylikFaiz: number, vade: number, odenen: number, v: Vergi): number {
  if (odenen <= 0) return tutar;
  if (odenen >= vade) return 0;
  const efektif = aylikFaiz * (1 + v.bsmv + v.kkdf);
  const t = annuity(tutar, efektif, vade);
  let kalan = tutar;
  // Her ay anapara payı = taksit − (faiz + BSMV + KKDF) = taksit − kalan × efektif oran
  for (let i = 0; i < odenen; i++) kalan -= t - kalan * efektif;
  return Math.max(0, kalan);
}

export interface NeKadarSonuc { azamiTaksit: number; azamiKredi: number; toplamOdeme: number }

/**
 * Taksitin hane gelirinin belirli oranını (bankaların genel uygulaması %50) aşmaması şartıyla
 * çekilebilecek en yüksek kredi: taksitlerin vergiler dahil efektif oranla bugünkü değeri.
 */
export function neKadarKredi(toplamGelir: number, gelirOrani: number, mevcutTaksit: number, aylikFaiz: number, vade: number, v: Vergi): NeKadarSonuc {
  const azamiTaksit = Math.max(0, toplamGelir * gelirOrani - mevcutTaksit);
  const efektif = aylikFaiz * (1 + v.bsmv + v.kkdf);
  const azamiKredi = azamiTaksit > 0 ? presentValueOfAnnuity(azamiTaksit, efektif, vade) : 0;
  return { azamiTaksit: round2(azamiTaksit), azamiKredi: round2(azamiKredi), toplamOdeme: round2(azamiTaksit * vade) };
}

export interface GecikmeSonuc { gecikmeOrani: number; faiz: number; bsmv: number; kkdf: number; toplamEk: number; toplam: number }

/**
 * Tüketici kredisinde gecikme faizi oranı akdi faizin %30 fazlasını geçemez. Gecikme faizi
 * gecikmiş taksit tutarı üzerinden gün esasıyla (aylık oran / 30) işler; üzerine BSMV ve KKDF eklenir.
 */
export function krediGecikme(taksit: number, akdiAylik: number, gun: number, v: Vergi): GecikmeSonuc {
  const gecikmeOrani = akdiAylik * 1.3;
  const faiz = round2((taksit * gecikmeOrani * gun) / 30);
  const bsmv = round2(faiz * v.bsmv);
  const kkdf = round2(faiz * v.kkdf);
  const toplamEk = round2(faiz + bsmv + kkdf);
  return { gecikmeOrani, faiz, bsmv, kkdf, toplamEk, toplam: round2(taksit + toplamEk) };
}

export interface YmoSonuc { aylik: number; yillik: number; toplamOdeme: number; toplamMaliyet: number; netKullanilan: number; taksit: number }

/**
 * Yıllık maliyet oranı: masraflar düşülmüş net kullanılan tutarı, vergiler dahil taksitlere eşitleyen
 * aylık oranın yıllık bileşiği ((1 + i)¹² − 1).
 */
export function yillikMaliyetOrani(tutar: number, aylikFaiz: number, vade: number, v: Vergi, masraf: number): YmoSonuc | null {
  const taksit = annuity(tutar, aylikFaiz * (1 + v.bsmv + v.kkdf), vade);
  const net = tutar - masraf;
  if (!(net > 0)) return null;
  const i = solveMonotone((r) => -presentValueOfAnnuity(taksit, r, vade), -net, 1e-12, 5);
  if (!Number.isFinite(i)) return null;
  return {
    aylik: i, yillik: (1 + i) ** 12 - 1, toplamOdeme: round2(taksit * vade),
    toplamMaliyet: round2(taksit * vade - tutar + masraf), netKullanilan: round2(net), taksit: round2(taksit),
  };
}

export interface YapilandirmaSonuc {
  kalanAnapara: number; eskiTaksit: number; eskiKalanOdeme: number;
  ceza: number; yeniTutar: number; yeniTaksit: number; yeniToplam: number; fark: number;
}

/** Mevcut krediyi kapatıp kalan anapara + erken kapama ücreti + masrafla yeni kredi çekmek. */
export function krediYapilandirma(
  tutar: number, faiz: number, vade: number, odenen: number, v: Vergi,
  cezaOrani: number, masraf: number, yeniFaiz: number, yeniVade: number,
): YapilandirmaSonuc | null {
  if (odenen >= vade) return null;
  const eski = krediPlani(tutar, faiz, vade, v);
  const kalan = kalanAnapara(tutar, faiz, vade, odenen, v);
  const eskiKalanOdeme = round2(eski.taksit * (vade - odenen));
  const ceza = round2(kalan * cezaOrani);
  const yeniTutar = round2(kalan + ceza + masraf);
  const yeni = krediPlani(yeniTutar, yeniFaiz, yeniVade, v);
  return {
    kalanAnapara: round2(kalan), eskiTaksit: eski.taksit, eskiKalanOdeme, ceza, yeniTutar,
    yeniTaksit: yeni.taksit, yeniToplam: yeni.toplamOdeme, fark: round2(eskiKalanOdeme - yeni.toplamOdeme),
  };
}

/** Konut finansmanında erken ödeme tazminatı (6502 s. K. md. 37): kalan vade ≤ 36 ay %1, üstü %2. */
export function erkenKapatmaTazminati(erkenOdenen: number, kalanVadeAy: number): { oran: number; tazminat: number } {
  const oran = kalanVadeAy <= 36 ? 0.01 : 0.02;
  return { oran, tazminat: round2(erkenOdenen * oran) };
}

// ── Kredi kartı ────────────────────────────────────────────────────────

/** BDDK: kart limiti 50.000 TL'ye kadar dönem borcunun %20'si, üzerinde %40'ı. */
export function asgariOdemeOrani(limit: number): number {
  return limit <= 50000 ? 0.2 : 0.4;
}

export interface KartGecikmeSonuc {
  asgari: number; odenmeyenAsgari: number; akdiyeTabi: number;
  gecikmeFaizi: number; akdiFaiz: number; vergi: number; toplamFaiz: number; kalanBorc: number; sonrakiBorc: number;
}

/**
 * 5464 s. K. md. 26: ödenmeyen asgari tutara gecikme faizi, dönem borcunun asgari dışında kalan
 * ödenmeyen kısmına akdi faiz uygulanır. Faizler gün esasıyla (aylık oran / 30); üzerine BSMV %15 + KKDF %15.
 */
export function kartGecikme(donemBorcu: number, limit: number, odeme: number, akdiAylik: number, gecikmeAylik: number, gun: number): KartGecikmeSonuc {
  const asgari = round2(donemBorcu * asgariOdemeOrani(limit));
  const kalanBorc = Math.max(0, donemBorcu - odeme);
  const odenmeyenAsgari = Math.max(0, asgari - odeme);
  const akdiyeTabi = Math.max(0, kalanBorc - odenmeyenAsgari);
  const gecikmeFaizi = round2((odenmeyenAsgari * gecikmeAylik * gun) / 30);
  const akdiFaiz = round2((akdiyeTabi * akdiAylik * gun) / 30);
  const vergi = round2((gecikmeFaizi + akdiFaiz) * 0.3);
  const toplamFaiz = round2(gecikmeFaizi + akdiFaiz + vergi);
  return { asgari, odenmeyenAsgari: round2(odenmeyenAsgari), akdiyeTabi: round2(akdiyeTabi), gecikmeFaizi, akdiFaiz, vergi, toplamFaiz, kalanBorc: round2(kalanBorc), sonrakiBorc: round2(kalanBorc + toplamFaiz) };
}

export interface TaksitSonuc { taksit: number; toplam: number; faiz: number; bsmv: number; kkdf: number }

/** Kart işlemini veya nakit avansı taksitlendirme: efektif oran = akdi × 1,30. */
export function kartTaksit(tutar: number, akdiAylik: number, n: number): TaksitSonuc {
  const p = krediPlani(tutar, akdiAylik, n, KREDI_VERGI.kart);
  return { taksit: p.taksit, toplam: p.toplamOdeme, faiz: p.toplamFaiz, bsmv: p.toplamBsmv, kkdf: p.toplamKkdf };
}

export const KREDI_DOSYA_MASRAFI_ORANI = 0.005;
