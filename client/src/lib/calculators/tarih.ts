// Tarih hesapları: gün farkı, yaş, tarihe gün ekleme, iş günü.

import { RESMI_TATILLER, TATIL_KAPSAMI } from './params.ts';
import { addDays, addMonths, addYears, dayNumber, daysBetween, diffYmd, weekday, type Ymd } from './core.ts';

const TATIL_MAP = new Map(RESMI_TATILLER.map((t) => [t.date, t]));

export interface GunFarkiSonuc { gun: number; hafta: number; artanGun: number; ymd: Ymd; haftaIci: number; saat: number }

/** b − a gün. sonGunDahil ise bitiş günü de sayılır (+1). Hafta içi: Pazartesi–Cuma günleri. */
export function gunFarki(a: string, b: string, sonGunDahil: boolean): GunFarkiSonuc {
  const [bas, bit] = a <= b ? [a, b] : [b, a];
  const gun = daysBetween(bas, bit) + (sonGunDahil ? 1 : 0);
  const sonGun = sonGunDahil ? bit : addDays(bit, -1);
  return {
    gun, hafta: Math.floor(gun / 7), artanGun: gun % 7,
    ymd: diffYmd(bas, sonGunDahil ? addDays(bit, 1) : bit),
    haftaIci: gun > 0 ? isGunuSay(bas, sonGun, false, false).isGunu : 0, saat: gun * 24,
  };
}

export interface YasSonuc { ymd: Ymd; toplamGun: number; toplamAy: number; toplamHafta: number; sonrakiDogumGunu: string; kalanGun: number; dogumGunu: number; yeniYas: number }

export function yas(dogum: string, tarih: string): YasSonuc | null {
  if (dogum > tarih) return null;
  const ymd = diffYmd(dogum, tarih);
  // Bugün doğum günüyse bugünü, değilse bir sonrakini göster. 29 Şubat doğumlular artık
  // olmayan yıllarda 28 Şubat'ta kutlar (addYears ay sonuna kırpar).
  const bugunDogumGunu = addYears(dogum, ymd.years) === tarih;
  const sonraki = bugunDogumGunu ? tarih : addYears(dogum, ymd.years + 1);
  const toplamGun = daysBetween(dogum, tarih);
  return {
    ymd, toplamGun, toplamAy: ymd.years * 12 + ymd.months, toplamHafta: Math.floor(toplamGun / 7),
    sonrakiDogumGunu: sonraki, kalanGun: daysBetween(tarih, sonraki), dogumGunu: weekday(dogum),
    yeniYas: bugunDogumGunu ? ymd.years : ymd.years + 1,
  };
}

export type Birim = 'gun' | 'hafta' | 'ay' | 'yil' | 'isgunu';

/** Tarihe süre ekler/çıkarır. 'isgunu' hafta sonu ve resmî tatilleri atlar. */
export function tarihEkle(tarih: string, miktar: number, birim: Birim): string {
  switch (birim) {
    case 'gun': return addDays(tarih, miktar);
    case 'hafta': return addDays(tarih, miktar * 7);
    case 'ay': return addMonths(tarih, miktar);
    case 'yil': return addYears(tarih, miktar);
    case 'isgunu': {
      const yon = miktar >= 0 ? 1 : -1;
      let kalan = Math.abs(miktar);
      let d = tarih;
      while (kalan > 0) {
        d = addDays(d, yon);
        if (isIsGunu(d, false)) kalan--;
      }
      return d;
    }
  }
}

function isIsGunu(d: string, cumartesi: boolean, tatillerHaric = true): boolean {
  const w = weekday(d);
  if (w === 0 || (w === 6 && !cumartesi)) return false;
  const t = tatillerHaric ? TATIL_MAP.get(d) : undefined;
  return !(t && !t.half);
}

export interface IsGunuSonuc { takvimGunu: number; isGunu: number; haftaSonu: number; tatilGunu: number; yarimGun: number; tatiller: { date: string; name: string; half?: boolean }[]; kapsamDisi: boolean }

/**
 * a ve b dahil iş günü sayısı. Resmî tatil hafta içine denk geliyorsa düşülür; arife günleri
 * yarım gün (0,5) sayılır. Tatil verisi 2025–2027 için vardır.
 */
export function isGunuSay(a: string, b: string, cumartesiCalisilir: boolean, tatillerHaric = true): IsGunuSonuc {
  const [bas, bit] = a <= b ? [a, b] : [b, a];
  let isGunu = 0;
  let haftaSonu = 0;
  let tatilGunu = 0;
  let yarimGun = 0;
  const tatiller: IsGunuSonuc['tatiller'] = [];
  const n = dayNumber(bit) - dayNumber(bas);
  for (let i = 0; i <= n; i++) {
    const d = addDays(bas, i);
    const w = weekday(d);
    const haftaSonuMu = w === 0 || (w === 6 && !cumartesiCalisilir);
    const t = tatillerHaric ? TATIL_MAP.get(d) : undefined;
    if (t) tatiller.push(t);
    if (haftaSonuMu) { haftaSonu++; continue; }
    if (t && !t.half) { tatilGunu++; continue; }
    if (t?.half) { yarimGun++; isGunu += 0.5; continue; }
    isGunu++;
  }
  return {
    takvimGunu: n + 1, isGunu, haftaSonu, tatilGunu, yarimGun, tatiller,
    kapsamDisi: tatillerHaric && (bas < TATIL_KAPSAMI.from || bit > TATIL_KAPSAMI.to),
  };
}
