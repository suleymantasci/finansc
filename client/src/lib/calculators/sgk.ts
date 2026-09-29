// SGK ve emeklilik hesapları: emeklilik tarihi, hizmet borçlanması, BES.

import {
  ASGARI_UCRET_BRUT, BES_DEVLET_KATKISI, BES_HAK_EDIS, BORCLANMA_ORANI, BORCLANMA_ORANI_2025,
  SGK_TAVAN_KATSAYI, valueAt,
} from './params.ts';
import { addDays, addYears, round2 } from './core.ts';

// ── Emeklilik ───────────────────────────────────────────────────────────

export type Cinsiyet = 'kadin' | 'erkek';
export type Statu = '4a' | '4b';

/**
 * 8.9.1999 (dahil) öncesi 4/a sigortalıları için prim günü — SGK 2023/13 sayılı Genelge
 * (5510 Geçici 95, 506 Geçici 81/B). [ilk giriş tarihine kadar (dahil), gün]
 */
const EYT_4A_KADIN: [string, number][] = [
  ['1985-05-23', 5000], ['1986-05-23', 5075], ['1987-05-23', 5150], ['1988-05-23', 5225],
  ['1989-05-23', 5300], ['1990-05-23', 5375], ['1991-05-23', 5450], ['1992-05-23', 5525],
  ['1993-05-23', 5600], ['1994-05-23', 5675], ['1995-05-23', 5750], ['1996-05-23', 5825],
  ['1997-05-23', 5900], ['1999-09-08', 5975],
];
const EYT_4A_ERKEK: [string, number][] = [
  ['1980-11-23', 5000], ['1982-05-23', 5075], ['1983-11-23', 5150], ['1985-05-23', 5225],
  ['1986-11-23', 5300], ['1988-05-23', 5375], ['1989-11-23', 5450], ['1991-05-23', 5525],
  ['1992-11-23', 5600], ['1994-05-23', 5675], ['1995-11-23', 5750], ['1997-05-23', 5825],
  ['1998-11-23', 5900], ['1999-09-08', 5975],
];

export function eytPrimGunu(cinsiyet: Cinsiyet, giris: string): number {
  const tablo = cinsiyet === 'kadin' ? EYT_4A_KADIN : EYT_4A_ERKEK;
  for (const [sinir, gun] of tablo) if (giris <= sinir) return gun;
  return tablo[tablo.length - 1][1];
}

/** 1.5.2008 sonrası girişlerde yaş: prim şartının tamamlandığı yıla göre (5510 md. 28). */
export function kademeliYas(cinsiyet: Cinsiyet, tamamlanmaYili: number): number {
  const k = cinsiyet === 'kadin';
  if (tamamlanmaYili <= 2035) return k ? 58 : 60;
  if (tamamlanmaYili <= 2037) return k ? 59 : 61;
  if (tamamlanmaYili <= 2039) return k ? 60 : 62;
  if (tamamlanmaYili <= 2041) return k ? 61 : 63;
  if (tamamlanmaYili <= 2043) return k ? 62 : 64;
  if (tamamlanmaYili <= 2045) return k ? 63 : 65;
  if (tamamlanmaYili <= 2047) return k ? 64 : 65;
  return 65;
}

export type Donem = 'eyt' | '1999-2008' | '2008-sonrasi';

export interface EmeklilikSart {
  donem: Donem;
  gerekenGun: number;
  gerekenYas: number | null;
  gerekenSigortalilikYil: number | null;
  primTamamlanma: string;
  yasTamamlanma: string | null;
  sigortalilikTamamlanma: string | null;
  emeklilikTarihi: string;
  aciklama: string;
}

export interface EmeklilikGirdi {
  statu: Statu;
  cinsiyet: Cinsiyet;
  dogum: string;
  giris: string;
  primGun: number;
  bugun: string;
  /** Bundan sonra yılda ödenecek ortalama prim günü (tam çalışma 360) */
  yillikPrim: number;
}

/** Kalan prim gününün tamamlanacağı tahmini tarih */
function primTarihi(g: EmeklilikGirdi, gereken: number): string {
  const kalan = gereken - g.primGun;
  if (kalan <= 0) return g.bugun;
  if (!(g.yillikPrim > 0)) return '9999-12-31';
  return addDays(g.bugun, Math.ceil((kalan / g.yillikPrim) * 365));
}

function maxDate(...d: (string | null)[]): string {
  return d.filter((x): x is string => !!x).sort().at(-1)!;
}

/**
 * Yaşlılık aylığına hak kazanma tarihini tahmin eder (4/a ve 4/b, normal emeklilik).
 * Birden fazla yol varsa en erken tarihi verir.
 */
export function emeklilikHesapla(g: EmeklilikGirdi): EmeklilikSart {
  const kadin = g.cinsiyet === 'kadin';

  if (g.giris <= '1999-09-08') {
    if (g.statu === '4a') {
      const gun = eytPrimGunu(g.cinsiyet, g.giris);
      const yil = kadin ? 20 : 25;
      const primT = primTarihi(g, gun);
      const sigT = addYears(g.giris, yil);
      return {
        donem: 'eyt', gerekenGun: gun, gerekenYas: null, gerekenSigortalilikYil: yil,
        primTamamlanma: primT, yasTamamlanma: null, sigortalilikTamamlanma: sigT,
        emeklilikTarihi: maxDate(primT, sigT),
        aciklama: `8 Eylül 1999 öncesi girişlilerde yaş şartı yok (EYT): ${gun} prim günü ve ${yil} yıl sigortalılık.`,
      };
    }
    const gun = kadin ? 7200 : 9000;
    const primT = primTarihi(g, gun);
    return {
      donem: 'eyt', gerekenGun: gun, gerekenYas: null, gerekenSigortalilikYil: null,
      primTamamlanma: primT, yasTamamlanma: null, sigortalilikTamamlanma: null, emeklilikTarihi: primT,
      aciklama: `8 Eylül 1999 öncesi Bağ-Kur girişlilerde yaş şartı yok (EYT): ${kadin ? 20 : 25} tam yıl (${gun} gün) prim.`,
    };
  }

  if (g.giris <= '2008-04-30') {
    const yas = kadin ? 58 : 60;
    const yasT = addYears(g.dogum, yas);
    if (g.statu === '4a') {
      const tamT = maxDate(primTarihi(g, 7000), yasT);
      const kismiPrim = primTarihi(g, 4500);
      const kismiSig = addYears(g.giris, 25);
      const kismiT = maxDate(kismiPrim, kismiSig, yasT);
      const tamErken = tamT <= kismiT;
      return {
        donem: '1999-2008', gerekenGun: tamErken ? 7000 : 4500, gerekenYas: yas,
        gerekenSigortalilikYil: tamErken ? null : 25,
        primTamamlanma: tamErken ? primTarihi(g, 7000) : kismiPrim, yasTamamlanma: yasT,
        sigortalilikTamamlanma: tamErken ? null : kismiSig, emeklilikTarihi: tamErken ? tamT : kismiT,
        aciklama: tamErken
          ? `9.9.1999–30.4.2008 arası girişlilerde ${yas} yaş ve 7000 prim günü.`
          : `${yas} yaş, 25 yıl sigortalılık ve 4500 prim günüyle (bu yol daha erken).`,
      };
    }
    const primT = primTarihi(g, 9000);
    return {
      donem: '1999-2008', gerekenGun: 9000, gerekenYas: yas, gerekenSigortalilikYil: null,
      primTamamlanma: primT, yasTamamlanma: yasT, sigortalilikTamamlanma: null,
      emeklilikTarihi: maxDate(primT, yasT),
      aciklama: `9.9.1999–30.4.2008 arası Bağ-Kur girişlilerde ${yas} yaş ve 9000 prim günü.`,
    };
  }

  const gun = g.statu === '4a' ? 7200 : 9000;
  const primT = primTarihi(g, gun);
  const yas = kademeliYas(g.cinsiyet, Number(primT.slice(0, 4)));
  const yasT = addYears(g.dogum, yas);
  return {
    donem: '2008-sonrasi', gerekenGun: gun, gerekenYas: yas, gerekenSigortalilikYil: null,
    primTamamlanma: primT, yasTamamlanma: yasT, sigortalilikTamamlanma: null,
    emeklilikTarihi: maxDate(primT, yasT),
    aciklama: `1 Mayıs 2008 sonrası girişlilerde ${gun} prim günü; yaş, prim şartının tamamlandığı yıla göre kademeli (${yas}).`,
  };
}

// ── Hizmet borçlanması (5510 md. 41) ──────────────────────────────────

export type BorclanmaTuru = 'dogum' | 'askerlik' | 'yurtdisi';

export interface BorclanmaSonuc {
  oran: number;
  gunlukAlt: number;
  gunlukUst: number;
  gunlukKazanc: number;
  gunlukPrim: number;
  toplam: number;
}

/**
 * Borçlanma tutarı = gün × seçilen günlük kazanç × oran. Günlük kazanç, prime esas
 * kazancın alt (asgari ücret/30) ve üst (alt sınırın 9 katı, 2026) sınırı arasında seçilir.
 */
export function borclanma(tur: BorclanmaTuru, gun: number, gunlukKazanc: number | null, tarih: string): BorclanmaSonuc {
  const oran = tarih >= '2026-01-01' ? BORCLANMA_ORANI[tur] : BORCLANMA_ORANI_2025[tur];
  const gunlukAlt = round2(valueAt(ASGARI_UCRET_BRUT, tarih) / 30);
  const gunlukUst = round2(gunlukAlt * valueAt(SGK_TAVAN_KATSAYI, tarih));
  const secilen = gunlukKazanc == null || !(gunlukKazanc > 0) ? gunlukAlt : Math.min(gunlukUst, Math.max(gunlukAlt, gunlukKazanc));
  const gunlukPrim = round2(secilen * oran);
  return { oran, gunlukAlt, gunlukUst, gunlukKazanc: secilen, gunlukPrim, toplam: round2(gunlukPrim * gun) };
}

// ── BES ─────────────────────────────────────────────────────────────────

export function besHakEdisOrani(yil: number, yas: number): number {
  if (yil >= 10 && yas >= 56) return 1;
  let oran = 0;
  for (const h of BES_HAK_EDIS) if (yil >= h.years) oran = h.rate;
  return oran;
}

export interface BesSonuc {
  devletKatkiOrani: number;
  yillikTavan: number;
  aylikDevletKatkisi: number;
  toplamKatki: number;
  katkiBirikimi: number;
  toplamDevletKatkisi: number;
  devletKatkisiBirikimi: number;
  hakEdisOrani: number;
  hakEdilenDevletKatkisi: number;
  toplamBirikim: number;
}

/**
 * Aylık düzenli katkı ile BES projeksiyonu. Katkı ve devlet katkısı her ay sonunda yatırılır,
 * yıllık getiri aylık bileşik eşdeğerle işler. Devlet katkısı yıllık tavanı bugünkü değerle sabit varsayılır.
 */
export function besHesapla(aylikKatki: number, yil: number, yillikGetiri: number, baslangicYasi: number, tarih: string): BesSonuc {
  const devletKatkiOrani = valueAt(BES_DEVLET_KATKISI, tarih);
  const yillikTavan = round2(valueAt(ASGARI_UCRET_BRUT, tarih) * 12 * devletKatkiOrani);
  const aylikDevletKatkisi = Math.min(aylikKatki * devletKatkiOrani, yillikTavan / 12);
  const ay = Math.round(yil * 12);
  const r = (1 + yillikGetiri) ** (1 / 12) - 1;
  let katkiBirikimi = 0;
  let dkBirikimi = 0;
  for (let i = 0; i < ay; i++) {
    katkiBirikimi = katkiBirikimi * (1 + r) + aylikKatki;
    dkBirikimi = dkBirikimi * (1 + r) + aylikDevletKatkisi;
  }
  const hakEdisOrani = besHakEdisOrani(yil, baslangicYasi + yil);
  return {
    devletKatkiOrani, yillikTavan, aylikDevletKatkisi: round2(aylikDevletKatkisi),
    toplamKatki: round2(aylikKatki * ay), katkiBirikimi: round2(katkiBirikimi),
    toplamDevletKatkisi: round2(aylikDevletKatkisi * ay), devletKatkisiBirikimi: round2(dkBirikimi),
    hakEdisOrani, hakEdilenDevletKatkisi: round2(dkBirikimi * hakEdisOrani),
    toplamBirikim: round2(katkiBirikimi + dkBirikimi * hakEdisOrani),
  };
}

// ── Finansal özgürlük ──────────────────────────────────────────────────

export interface FireSonuc {
  hedef: number;
  ay: number | null;
  tarihYil: number | null;
  birikimSonunda: number | null;
}

/** Hedef = yıllık gider / güvenli çekim oranı. Aylık yatırımla hedefe kaç ayda ulaşılır (reel getiri). */
export function finansalOzgurluk(aylikGider: number, cekimOrani: number, mevcut: number, aylikYatirim: number, reelGetiri: number): FireSonuc {
  const hedef = round2((aylikGider * 12) / cekimOrani);
  if (mevcut >= hedef) return { hedef, ay: 0, tarihYil: 0, birikimSonunda: round2(mevcut) };
  const r = (1 + reelGetiri) ** (1 / 12) - 1;
  let b = mevcut;
  for (let i = 1; i <= 1200; i++) {
    b = b * (1 + r) + aylikYatirim;
    if (b >= hedef) return { hedef, ay: i, tarihYil: i / 12, birikimSonunda: round2(b) };
  }
  return { hedef, ay: null, tarihYil: null, birikimSonunda: null };
}
