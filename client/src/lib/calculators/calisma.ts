// Çalışma hayatı hesapları: kıdem, ihbar, işsizlik, rapor parası, yıllık izin,
// fazla mesai, asgari ücret, doğum izni.

import {
  ASGARI_UCRET_BRUT, DAMGA_UCRET, DOGUM_IZNI, GELIR_VERGISI_TARIFESI, ISSIZLIK_ISCI_ORANI,
  ISSIZLIK_ISVEREN_ORANI, ISSIZLIK_ORAN, ISSIZLIK_TAVAN_ORAN, KIDEM_TAVANI, SGK_ISCI_ORANI,
  SGK_ISVEREN_ORANI, SGK_TAVAN_KATSAYI, SON_GV_YILI, YILLIK_IZIN, valueAt,
} from './params.ts';
import { addDays, addYears, diffYmd, incrementalTax, round2, type Ymd } from './core.ts';

/** Çıkış günü de çalışılmış sayılır: süre = giriş → çıkış+1 gün. */
export function hizmetSuresi(giris: string, cikis: string): Ymd {
  return diffYmd(giris, addDays(cikis, 1));
}

function gvTarifesi(tarih: string) {
  const yil = Number(tarih.slice(0, 4));
  return GELIR_VERGISI_TARIFESI[yil] ?? GELIR_VERGISI_TARIFESI[SON_GV_YILI];
}

// ── Kıdem tazminatı (1475 s. K. md. 14) ───────────────────────────────

export interface KidemSonuc {
  sure: Ymd;
  hakVar: boolean;
  giydirilmisBrut: number;
  tavan: number;
  tavanUygulandi: boolean;
  esasUcret: number;
  brut: number;
  damga: number;
  net: number;
}

/**
 * Her tam yıl için 30 günlük giydirilmiş brüt ücret; artan ay ve gün için oransal
 * (ay: ücret/12, gün: ücret/365). Ücret, çıkış tarihindeki kıdem tavanını aşamaz.
 * Gelir vergisinden istisna; yalnızca binde 7,59 damga vergisi kesilir.
 */
export function kidemTazminati(giris: string, cikis: string, brutUcret: number, yanHaklar = 0): KidemSonuc {
  const sure = hizmetSuresi(giris, cikis);
  const giydirilmisBrut = brutUcret + yanHaklar;
  const tavan = valueAt(KIDEM_TAVANI, cikis);
  const esasUcret = Math.min(giydirilmisBrut, tavan);
  const hakVar = sure.years >= 1;
  const brut = hakVar
    ? round2(esasUcret * sure.years + (esasUcret / 12) * sure.months + (esasUcret / 365) * sure.days)
    : 0;
  const damga = round2(brut * DAMGA_UCRET);
  return {
    sure, hakVar, giydirilmisBrut, tavan, tavanUygulandi: giydirilmisBrut > tavan, esasUcret,
    brut, damga, net: round2(brut - damga),
  };
}

// ── İhbar tazminatı (4857 md. 17) ──────────────────────────────────────

export function ihbarSuresiHafta(sure: Ymd): number {
  const ay = sure.years * 12 + sure.months;
  if (ay < 6) return 2;
  if (ay < 18) return 4;
  if (ay < 36) return 6;
  return 8;
}

export interface IhbarSonuc {
  sure: Ymd;
  hafta: number;
  gun: number;
  gunlukBrut: number;
  brut: number;
  gelirVergisi: number;
  damga: number;
  net: number;
}

/**
 * İhbar süresi kadar giydirilmiş brüt ücret. Gelir vergisi, yıl içindeki kümülatif
 * ücret matrahının üzerine eklenerek ücret tarifesiyle; damga binde 7,59. SGK primi kesilmez.
 */
export function ihbarTazminati(giris: string, cikis: string, brutUcret: number, yanHaklar = 0, kumulatifMatrah = 0): IhbarSonuc {
  const sure = hizmetSuresi(giris, cikis);
  const hafta = ihbarSuresiHafta(sure);
  const gun = hafta * 7;
  const gunlukBrut = (brutUcret + yanHaklar) / 30;
  const brut = round2(gunlukBrut * gun);
  const gelirVergisi = round2(incrementalTax(kumulatifMatrah, brut, gvTarifesi(cikis).ucret));
  const damga = round2(brut * DAMGA_UCRET);
  return { sure, hafta, gun, gunlukBrut, brut, gelirVergisi, damga, net: round2(brut - gelirVergisi - damga) };
}

// ── İşsizlik ödeneği (4447 md. 50) ────────────────────────────────────

export function issizlikSuresiGun(primGun: number): number {
  if (primGun >= 1080) return 300;
  if (primGun >= 900) return 240;
  if (primGun >= 600) return 180;
  return 0;
}

export interface IssizlikSonuc {
  aylikBrut: number;
  tavan: number;
  tavanUygulandi: boolean;
  damga: number;
  aylikNet: number;
  gunlukNet: number;
  sureGun: number;
  sureAy: number;
  toplamNet: number;
}

/** Aylık ödenek = son 4 ay ort. brüt × %40, brüt asgari ücretin %80'ini aşamaz; yalnızca damga kesilir. */
export function issizlikMaasi(ortalamaBrut: number, primGun: number, tarih: string): IssizlikSonuc {
  const asgari = valueAt(ASGARI_UCRET_BRUT, tarih);
  const tavan = round2(asgari * ISSIZLIK_TAVAN_ORAN);
  const hesaplanan = round2(ortalamaBrut * ISSIZLIK_ORAN);
  const aylikBrut = Math.min(hesaplanan, tavan);
  const damga = round2(aylikBrut * DAMGA_UCRET);
  const aylikNet = round2(aylikBrut - damga);
  const sureGun = issizlikSuresiGun(primGun);
  const sureAy = sureGun / 30;
  return {
    aylikBrut, tavan, tavanUygulandi: hesaplanan > tavan, damga, aylikNet,
    gunlukNet: round2(aylikNet / 30), sureGun, sureAy, toplamNet: round2(aylikNet * sureAy),
  };
}

// ── Geçici iş göremezlik ödeneği / rapor parası (5510 md. 18) ─────────

export type RaporTuru = 'hastalik' | 'is-kazasi' | 'analik';

export interface RaporSonuc {
  gunlukKazanc: number;
  tavanUygulandi: boolean;
  oran: number;
  gunlukOdenek: number;
  odenecekGun: number;
  toplam: number;
}

/**
 * Günlük kazanç = son 12 ayda prim ödenen son 3 ayın brüt kazancı / o aylardaki prim günü
 * (SGK günlük kazanç üst sınırıyla sınırlı). Ayakta tedavide 2/3, yatarak 1/2. Hastalıkta
 * ödenek raporun 3. gününden başlar; iş kazası/meslek hastalığı ve analıkta ilk günden.
 */
export function raporParasi(tur: RaporTuru, yatarak: boolean, ucAylikBrut: number, primGun: number, raporGun: number, tarih: string): RaporSonuc {
  const asgari = valueAt(ASGARI_UCRET_BRUT, tarih);
  const gunlukTavan = round2((asgari / 30) * valueAt(SGK_TAVAN_KATSAYI, tarih));
  const hamGunluk = primGun > 0 ? ucAylikBrut / primGun : 0;
  const gunlukKazanc = Math.min(round2(hamGunluk), gunlukTavan);
  const oran = tur === 'analik' ? 2 / 3 : yatarak ? 1 / 2 : 2 / 3;
  const gunlukOdenek = round2(gunlukKazanc * oran);
  const odenecekGun = tur === 'hastalik' ? Math.max(0, raporGun - 2) : raporGun;
  return {
    gunlukKazanc, tavanUygulandi: round2(hamGunluk) > gunlukTavan, oran, gunlukOdenek,
    odenecekGun, toplam: round2(gunlukOdenek * odenecekGun),
  };
}

// ── Yıllık ücretli izin (4857 md. 53) ─────────────────────────────────

export interface IzinSonuc {
  kidemYil: number;
  sure: Ymd;
  izinGun: number;
  yasIstisnasi: boolean;
  sonrakiHakEdis: string;
}

/**
 * Hizmeti 1–5 yıl (5 dahil) 14 gün, 5–15 yıl 20 gün, 15 yıl ve üzeri 26 gün.
 * 18 yaş ve altı ile 50 yaş ve üstü en az 20 gün; yer altı işlerinde +4 gün.
 */
export function yillikIzin(giris: string, tarih: string, yas: number, yeralti = false): IzinSonuc {
  const sure = diffYmd(giris, tarih);
  const y = sure.years;
  let gun = 0;
  if (y >= 15) gun = YILLIK_IZIN.kademe3;
  else if (y > 5) gun = YILLIK_IZIN.kademe2;
  else if (y >= 1) gun = YILLIK_IZIN.kademe1;
  let yasIstisnasi = false;
  if (gun > 0 && (yas <= 18 || yas >= 50) && gun < YILLIK_IZIN.yasIstisnasi) {
    gun = YILLIK_IZIN.yasIstisnasi;
    yasIstisnasi = true;
  }
  if (gun > 0 && yeralti) gun += YILLIK_IZIN.yeraltiEk;
  return { kidemYil: y, sure, izinGun: gun, yasIstisnasi, sonrakiHakEdis: addYears(giris, y + 1) };
}

// ── Fazla mesai (4857 md. 41, 47) ──────────────────────────────────────

export const AYLIK_CALISMA_SAATI = 225; // haftalık 45 saat × 30/7 gün

export interface FazlaMesaiSonuc {
  saatlikUcret: number;
  gunlukUcret: number;
  fazlaCalisma: number; // %50 zamlı
  fazlaSurelerle: number; // %25 zamlı
  tatil: number; // UBGT: ek 1 günlük ücret
  toplamBrut: number;
  sgk: number;
  issizlik: number;
  gelirVergisi: number;
  damga: number;
  toplamNet: number;
}

export function fazlaMesai(aylikBrut: number, saat50: number, saat25: number, tatilGun: number, gvOrani: number): FazlaMesaiSonuc {
  const saatlikUcret = aylikBrut / AYLIK_CALISMA_SAATI;
  const gunlukUcret = aylikBrut / 30;
  const fazlaCalisma = round2(saatlikUcret * 1.5 * saat50);
  const fazlaSurelerle = round2(saatlikUcret * 1.25 * saat25);
  const tatil = round2(gunlukUcret * tatilGun);
  const toplamBrut = round2(fazlaCalisma + fazlaSurelerle + tatil);
  const sgk = round2(toplamBrut * SGK_ISCI_ORANI);
  const issizlik = round2(toplamBrut * ISSIZLIK_ISCI_ORANI);
  const gelirVergisi = round2((toplamBrut - sgk - issizlik) * gvOrani);
  const damga = round2(toplamBrut * DAMGA_UCRET);
  return {
    saatlikUcret: round2(saatlikUcret), gunlukUcret: round2(gunlukUcret), fazlaCalisma, fazlaSurelerle, tatil,
    toplamBrut, sgk, issizlik, gelirVergisi, damga, toplamNet: round2(toplamBrut - sgk - issizlik - gelirVergisi - damga),
  };
}

// ── Asgari ücret ve işveren maliyeti ──────────────────────────────────

export interface AsgariSonuc {
  brut: number;
  sgkIsci: number;
  issizlikIsci: number;
  net: number;
  isverenOrani: number;
  sgkIsveren: number;
  issizlikIsveren: number;
  isverenMaliyeti: number;
  gunlukBrut: number;
  saatlikBrut: number;
}

/** 2022'den beri asgari ücret gelir ve damga vergisinden istisna. Teşvik: SGK işveren payından puan indirimi. */
export function asgariUcret(tarih: string, tesvikPuan = 0): AsgariSonuc {
  const brut = valueAt(ASGARI_UCRET_BRUT, tarih);
  const sgkIsci = round2(brut * SGK_ISCI_ORANI);
  const issizlikIsci = round2(brut * ISSIZLIK_ISCI_ORANI);
  const isverenOrani = valueAt(SGK_ISVEREN_ORANI, tarih) - tesvikPuan / 100;
  const sgkIsveren = round2(brut * isverenOrani);
  const issizlikIsveren = round2(brut * ISSIZLIK_ISVEREN_ORANI);
  return {
    brut, sgkIsci, issizlikIsci, net: round2(brut - sgkIsci - issizlikIsci), isverenOrani,
    sgkIsveren, issizlikIsveren, isverenMaliyeti: round2(brut + sgkIsveren + issizlikIsveren),
    gunlukBrut: round2(brut / 30), saatlikBrut: round2(brut / AYLIK_CALISMA_SAATI),
  };
}

// ── Doğum (analık) izni (4857 md. 74) ─────────────────────────────────

export interface DogumIzniSonuc {
  yeniKural: boolean;
  oncesiHafta: number;
  sonrasiHafta: number;
  devredilenHafta: number;
  baslangic: string;
  bitis: string;
  iseDonus: string;
  toplamHafta: number;
  toplamGun: number;
}

/**
 * Doğumdan önce 8 hafta (çoğul gebelikte 10), sonra 16 hafta (1.5.2026 öncesi doğumlarda 8).
 * Doktor onayıyla doğuma 2 hafta kalana kadar çalışılabilir; çalışılan süre doğum sonrasına eklenir.
 * @param izneCikisHafta Doğumdan kaç hafta önce izne çıkılacağı
 */
export function dogumIzni(dogumTarihi: string, cogul: boolean, izneCikisHafta?: number): DogumIzniSonuc {
  const yeniKural = dogumTarihi >= DOGUM_IZNI.yeniKuralTarihi;
  const oncesiHak = DOGUM_IZNI.oncesiHafta + (cogul ? DOGUM_IZNI.cogulEkHafta : 0);
  const enAz = yeniKural ? 2 : 3;
  const oncesiHafta = Math.min(oncesiHak, Math.max(enAz, izneCikisHafta ?? oncesiHak));
  const devredilenHafta = oncesiHak - oncesiHafta;
  const sonrasiHafta = (yeniKural ? DOGUM_IZNI.sonrasiHafta : DOGUM_IZNI.sonrasiHaftaEski) + devredilenHafta;
  const baslangic = addDays(dogumTarihi, -oncesiHafta * 7);
  const iseDonus = addDays(dogumTarihi, sonrasiHafta * 7);
  const toplamHafta = oncesiHafta + sonrasiHafta;
  return {
    yeniKural, oncesiHafta, sonrasiHafta, devredilenHafta, baslangic,
    bitis: addDays(iseDonus, -1), iseDonus, toplamHafta, toplamGun: toplamHafta * 7,
  };
}
