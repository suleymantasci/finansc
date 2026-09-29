// Yakıt ve elektrik hesapları.

import { round2 } from './core.ts';

export interface YakitMaliyetSonuc { mesafe: number; litre: number; maliyet: number; kisiBasi: number; kmBasi: number }

export function yakitMaliyeti(km: number, tuketim100: number, litreFiyat: number, kisi: number, gidisDonus: boolean): YakitMaliyetSonuc {
  const mesafe = km * (gidisDonus ? 2 : 1);
  const litre = (mesafe * tuketim100) / 100;
  const maliyet = round2(litre * litreFiyat);
  return { mesafe, litre, maliyet, kisiBasi: round2(maliyet / Math.max(1, kisi)), kmBasi: mesafe > 0 ? maliyet / mesafe : 0 };
}

export interface YakitTuketimSonuc { litre100: number; kmLitre: number; kmBasi: number | null; tl100: number | null }

export function yakitTuketimi(litre: number, km: number, litreFiyat: number | null): YakitTuketimSonuc | null {
  if (!(km > 0) || !(litre > 0)) return null;
  const litre100 = (litre / km) * 100;
  return {
    litre100, kmLitre: km / litre,
    kmBasi: litreFiyat && litreFiyat > 0 ? (litre * litreFiyat) / km : null,
    tl100: litreFiyat && litreFiyat > 0 ? litre100 * litreFiyat : null,
  };
}

export interface SarjSonuc { batarya: number; sebekedenCekilen: number; maliyet: number; menzil: number | null; tl100: number | null }

/**
 * Bataryaya giren enerji = kapasite × (hedef − başlangıç)%. Şarj kaybı (verim) nedeniyle
 * şebekeden çekilen enerji = batarya / verim.
 */
export function sarjMaliyeti(kapasite: number, baslangic: number, hedef: number, kwhFiyat: number, verim: number, tuketim100: number | null): SarjSonuc | null {
  if (!(hedef > baslangic) || !(verim > 0)) return null;
  const batarya = (kapasite * (hedef - baslangic)) / 100;
  const sebekedenCekilen = batarya / verim;
  const maliyet = round2(sebekedenCekilen * kwhFiyat);
  const menzil = tuketim100 && tuketim100 > 0 ? (batarya / tuketim100) * 100 : null;
  return { batarya, sebekedenCekilen, maliyet, menzil, tl100: tuketim100 && tuketim100 > 0 ? round2(((tuketim100 / verim) * kwhFiyat)) : null };
}

export interface ElektrikSonuc { gunlukKwh: number; toplamKwh: number; gunlukMaliyet: number; toplamMaliyet: number; aylikMaliyet: number }

export function elektrikTuketimi(watt: number, saatGun: number, gun: number, kwhFiyat: number, adet = 1): ElektrikSonuc {
  const gunlukKwh = (watt * saatGun * adet) / 1000;
  return {
    gunlukKwh, toplamKwh: gunlukKwh * gun, gunlukMaliyet: round2(gunlukKwh * kwhFiyat),
    toplamMaliyet: round2(gunlukKwh * gun * kwhFiyat), aylikMaliyet: round2(gunlukKwh * 30 * kwhFiyat),
  };
}
