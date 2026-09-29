// Emlak hesapları: tapu harcı, emlak vergisi, emlakçı komisyonu, kira getirisi.

import { EMLAKCI_SATIS_ORANI, EMLAK_VERGISI_ORANLARI, KDV_GENEL, TAPU_HARCI_ORANI } from './params.ts';
import { round2 } from './core.ts';

export interface TapuSonuc { matrah: number; aliciHarci: number; saticiHarci: number; toplamHarc: number; donerSermaye: number; aliciToplam: number; genelToplam: number }

/** Harç matrahı beyan edilen satış bedeli; emlak vergisi değerinden düşük olamaz. */
export function tapuHarci(satisBedeli: number, emlakVergiDegeri: number, donerSermaye: number): TapuSonuc {
  const matrah = Math.max(satisBedeli, emlakVergiDegeri || 0);
  const harc = round2(matrah * TAPU_HARCI_ORANI);
  return {
    matrah, aliciHarci: harc, saticiHarci: harc, toplamHarc: round2(harc * 2), donerSermaye: round2(donerSermaye),
    aliciToplam: round2(harc + donerSermaye), genelToplam: round2(harc * 2 + donerSermaye),
  };
}

export type EmlakTuru = keyof typeof EMLAK_VERGISI_ORANLARI;

export interface EmlakVergisiSonuc { oran: number; yillik: number; taksit: number }

/** Vergi değeri × oran; büyükşehir ve mücavir alanda oranlar %100 artırımlı. Hisse payına göre bölünür. */
export function emlakVergisi(vergiDegeri: number, tur: EmlakTuru, buyuksehir: boolean, hissePay = 1): EmlakVergisiSonuc {
  const oran = EMLAK_VERGISI_ORANLARI[tur] * (buyuksehir ? 2 : 1);
  const yillik = round2(vergiDegeri * oran * hissePay);
  return { oran, yillik, taksit: round2(yillik / 2) };
}

export interface KomisyonSonuc { taraf: number; tarafKdv: number; tarafToplam: number; genelToplam: number }

/** Satışta her iki taraftan ayrı ayrı %2 + KDV; kiralamada toplam en çok 1 aylık kira + KDV. */
export function emlakciKomisyonu(islem: 'satis' | 'kira', bedel: number): KomisyonSonuc {
  if (islem === 'satis') {
    const taraf = round2(bedel * EMLAKCI_SATIS_ORANI);
    const tarafKdv = round2(taraf * KDV_GENEL);
    return { taraf, tarafKdv, tarafToplam: round2(taraf + tarafKdv), genelToplam: round2((taraf + tarafKdv) * 2) };
  }
  const taraf = round2(bedel);
  const tarafKdv = round2(taraf * KDV_GENEL);
  return { taraf, tarafKdv, tarafToplam: round2(taraf + tarafKdv), genelToplam: round2(taraf + tarafKdv) };
}

export interface AmortismanSonuc {
  yillikKira: number;
  yillikNet: number;
  brutGetiri: number;
  netGetiri: number;
  sabitKiraYil: number;
  artisliKiraYil: number | null;
}

/**
 * Amortisman süresi: ev fiyatı / yıllık net kira. Kira her yıl `artis` oranında artarsa,
 * toplam net kiranın fiyata ulaştığı yıl (kesirli) ayrıca verilir.
 */
export function evAmortisman(fiyat: number, aylikKira: number, yillikGider: number, artis: number): AmortismanSonuc {
  const yillikKira = aylikKira * 12;
  const yillikNet = yillikKira - yillikGider;
  let artisliKiraYil: number | null = null;
  if (yillikNet > 0) {
    let toplam = 0;
    for (let y = 0; y < 200; y++) {
      const buYil = yillikKira * (1 + artis) ** y - yillikGider;
      if (buYil > 0 && toplam + buYil >= fiyat) {
        artisliKiraYil = y + (fiyat - toplam) / buYil;
        break;
      }
      toplam += Math.max(0, buYil);
    }
  }
  return {
    yillikKira: round2(yillikKira), yillikNet: round2(yillikNet), brutGetiri: yillikKira / fiyat,
    netGetiri: yillikNet / fiyat, sabitKiraYil: yillikNet > 0 ? fiyat / yillikNet : Infinity, artisliKiraYil,
  };
}
