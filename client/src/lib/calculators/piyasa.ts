// Menkul kıymet, iskonto, nakit akışı, enflasyon endeksi ve IBAN hesapları.

import { round2, solveMonotone } from './core.ts';

// ── Faiz getirili araçlar (bono, tahvil, repo) ─────────────────────────

export interface GetiriSonuc { brut: number; stopaj: number; net: number; toplam: number }

/** Basit faiz, 365 gün: anapara × yıllık oran × gün / 365; getiriden stopaj. */
export function basitGetiri(anapara: number, yillikOran: number, gun: number, stopajOrani: number): GetiriSonuc {
  const brut = round2((anapara * yillikOran * gun) / 365);
  const stopaj = round2(brut * stopajOrani);
  return { brut, stopaj, net: round2(brut - stopaj), toplam: round2(anapara + brut - stopaj) };
}

// ── Eurobond ─────────────────────────────────────────────────────────

export interface EurobondSonuc {
  maliyet: number; donemKupon: number; yillikKupon: number; toplamKupon: number; vadeDegeri: number;
  ytm: number; ytmYaklasik: number; cariGetiri: number;
}

/**
 * Nominal 1.000 birimlik tahviller. Vadeye kadar getiri (YTM), temiz fiyatı kupon ve anapara
 * nakit akışlarının bugünkü değerine eşitleyen yıllık orandır (kupon dönemine göre bileşik,
 * yıllık nominal olarak ifade edilir). Birikmiş faiz dikkate alınmaz (tam kupon dönemleri varsayımı).
 */
export function eurobond(temizFiyatYuzde: number, kuponYuzde: number, yil: number, adet: number, yilda: 1 | 2): EurobondSonuc | null {
  const nominal = 1000;
  const n = Math.round(yil * yilda);
  if (!(n > 0) || !(temizFiyatYuzde > 0)) return null;
  const fiyat = (temizFiyatYuzde / 100) * nominal;
  const c = ((kuponYuzde / 100) * nominal) / yilda;
  const pv = (r: number) => (r === 0 ? c * n + nominal : c * (1 - (1 + r) ** -n) / r + nominal * (1 + r) ** -n);
  const donem = solveMonotone((r) => -pv(r), -fiyat, -0.99, 10);
  const ytmYaklasik = ((kuponYuzde / 100) * nominal + (nominal - fiyat) / yil) / ((nominal + fiyat) / 2);
  return {
    maliyet: round2(fiyat * adet), donemKupon: round2(c * adet), yillikKupon: round2(c * yilda * adet),
    toplamKupon: round2(c * n * adet), vadeDegeri: round2(nominal * adet), ytm: donem * yilda, ytmYaklasik,
    cariGetiri: (c * yilda) / fiyat,
  };
}

// ── Sermaye artırımı / temettü sonrası teorik fiyat ─────────────────

export type SermayeIslem = 'temettu' | 'bedelsiz' | 'bedelli' | 'azaltim';

export interface SermayeSonuc { yeniAdet: number; yeniFiyat: number; toplamDeger: number; nakit: number }

/**
 * Oranlar ondalık. Temettüde oran = temettü verimi (hisse başı temettü / fiyat).
 * Bedelli sermaye artırımında pay başına 1 TL nominal ödenir (rüçhan).
 */
export function sermayeIslemi(tur: SermayeIslem, adet: number, fiyat: number, oran: number): SermayeSonuc {
  switch (tur) {
    case 'temettu': {
      const hbt = fiyat * oran;
      return { yeniAdet: adet, yeniFiyat: fiyat - hbt, toplamDeger: adet * (fiyat - hbt), nakit: round2(hbt * adet) };
    }
    case 'bedelsiz': {
      const yeniFiyat = fiyat / (1 + oran);
      const yeniAdet = adet * (1 + oran);
      return { yeniAdet, yeniFiyat, toplamDeger: yeniAdet * yeniFiyat, nakit: 0 };
    }
    case 'bedelli': {
      const yeniAdet = adet * (1 + oran);
      const odeme = adet * oran; // 1 TL nominal × yeni pay
      const yeniFiyat = (adet * fiyat + odeme) / yeniAdet;
      return { yeniAdet, yeniFiyat, toplamDeger: yeniAdet * yeniFiyat, nakit: -round2(odeme) };
    }
    case 'azaltim': {
      const yeniAdet = adet * (1 - oran);
      const yeniFiyat = fiyat / (1 - oran);
      return { yeniAdet, yeniFiyat, toplamDeger: yeniAdet * yeniFiyat, nakit: 0 };
    }
  }
}

// ── Nakit akışı ───────────────────────────────────────────────────────

/** NBD = Σ CFₜ / (1 + r)ᵗ, t = 1…n; başlangıç yatırımı t = 0'da düşülür. */
export function netBugunkuDeger(oran: number, akislar: number[], baslangic = 0): number {
  return akislar.reduce((s, cf, i) => s + cf / (1 + oran) ** (i + 1), 0) - baslangic;
}

/**
 * İç verim oranı: NBD'yi sıfırlayan oran. Geleneksel akışlarda (başta çıkış, sonra girişler)
 * NBD oranla azalır; kök -99,99% ile %10.000 arasında ikiye bölmeyle aranır.
 */
export function icVerimOrani(baslangic: number, akislar: number[]): number | null {
  const f = (r: number) => netBugunkuDeger(r, akislar, baslangic);
  const r = solveMonotone((x) => -f(x), 0, -0.9999, 100);
  return Number.isFinite(r) ? r : null;
}

export function cagr(bas: number, son: number, donem: number): number {
  return (son / bas) ** (1 / donem) - 1;
}

/** Taşıma maliyeti modeli: F = S × (1 + (r − d) × t/365) */
export function vadeliFiyat(spot: number, faiz: number, temettu: number, gun: number): number {
  return spot * (1 + (faiz - temettu) * (gun / 365));
}

// ── İskonto ───────────────────────────────────────────────────────────

export type IskontoTuru = 'dis' | 'ic' | 'bilesik';

/**
 * Ticari hesapta yıl 360 gün. Dış iskonto: nominalden peşin değer (iskonto nominal üzerinden).
 * İç iskonto: peşin değerden nominal. Bileşik: peşin × (1 + r)^(gün/360).
 */
export function iskonto(tur: IskontoTuru, deger: number, yillikOran: number, gun: number): { iskonto: number; diger: number } | null {
  if (tur === 'dis') {
    const isk = (deger * yillikOran * gun) / 360;
    return { iskonto: isk, diger: deger - isk };
  }
  if (tur === 'ic') {
    const payda = 360 - yillikOran * gun;
    if (!(payda > 0)) return null;
    const nominal = (deger * 360) / payda;
    return { iskonto: nominal - deger, diger: nominal };
  }
  const nominal = deger * (1 + yillikOran) ** (gun / 360);
  return { iskonto: nominal - deger, diger: nominal };
}

/** Ağırlıklı ortalama vade = Σ(tutar × gün) / Σ tutar */
export function ortalamaVade(kalemler: { tutar: number; gun: number }[]): { gun: number; toplam: number } | null {
  const toplam = kalemler.reduce((s, k) => s + k.tutar, 0);
  if (!(toplam > 0)) return null;
  return { gun: kalemler.reduce((s, k) => s + k.tutar * k.gun, 0) / toplam, toplam };
}

// ── TÜFE endeksi ──────────────────────────────────────────────────────

export interface EndeksNoktasi { year: number; month: number; value: number }
export type EndeksSerisi = Map<string, number>;

export const donemKey = (y: number, m: number) => `${y}-${String(m).padStart(2, '0')}`;

export function endeksSerisi(noktalar: EndeksNoktasi[]): EndeksSerisi {
  return new Map(noktalar.map((p) => [donemKey(p.year, p.month), p.value]));
}

function geri(y: number, m: number, k: number): [number, number] {
  const t = y * 12 + (m - 1) - k;
  return [Math.floor(t / 12), (t % 12) + 1];
}

/** İki dönem arası değişim oranı (hedef endeks / başlangıç endeksi − 1). Veri yoksa null. */
export function endeksDegisim(s: EndeksSerisi, by: number, bm: number, hy: number, hm: number): { oran: number; bas: number; hedef: number } | null {
  const bas = s.get(donemKey(by, bm));
  const hedef = s.get(donemKey(hy, hm));
  if (bas == null || hedef == null) return null;
  return { oran: hedef / bas - 1, bas, hedef };
}

/**
 * TÜİK "12 aylık ortalamalara göre değişim": son 12 ayın endeks ortalamasının önceki 12 ayın
 * ortalamasına oranı − 1. Konut ve iş yeri kira artışında yasal üst sınır budur.
 */
export function onikiAylikOrtalamaDegisim(s: EndeksSerisi, y: number, m: number): number | null {
  let a = 0;
  let b = 0;
  for (let k = 0; k < 12; k++) {
    const [y1, m1] = geri(y, m, k);
    const [y2, m2] = geri(y, m, k + 12);
    const v1 = s.get(donemKey(y1, m1));
    const v2 = s.get(donemKey(y2, m2));
    if (v1 == null || v2 == null) return null;
    a += v1;
    b += v2;
  }
  return a / b - 1;
}

// ── IBAN ──────────────────────────────────────────────────────────────

/** TCMB Ödeme Sistemleri Katılımcıları (2026) — 4 haneli banka (EFT) kodları */
export const TR_BANKA_KODLARI: Record<string, string> = {
  '0001': 'T.C. Merkez Bankası', '0004': 'İller Bankası', '0010': 'T.C. Ziraat Bankası', '0012': 'Türkiye Halk Bankası',
  '0014': 'Türkiye Sınai Kalkınma Bankası', '0015': 'Türkiye Vakıflar Bankası', '0016': 'Türk Eximbank', '0017': 'Türkiye Kalkınma ve Yatırım Bankası',
  '0029': 'Birleşik Fon Bankası', '0032': 'Türk Ekonomi Bankası (TEB)', '0046': 'Akbank', '0059': 'Şekerbank', '0060': 'Türk Ticaret Bankası',
  '0062': 'Garanti BBVA', '0064': 'Türkiye İş Bankası', '0067': 'Yapı Kredi', '0091': 'Arap Türk Bankası', '0092': 'Citibank',
  '0096': 'Freedom Bank', '0098': 'JPMorgan Chase Bank', '0099': 'ING Bank', '0103': 'Fibabanka', '0108': 'Türkland Bank',
  '0109': 'ICBC Turkey', '0111': 'QNB Finansbank', '0115': 'Deutsche Bank', '0116': 'Pasha Yatırım Bankası',
  '0121': 'Standard Chartered Yatırım Bankası', '0122': 'Société Générale', '0123': 'HSBC', '0124': 'Alternatifbank',
  '0125': 'Burgan Bank', '0129': 'Bank of America Yatırım Bank', '0132': 'İstanbul Takas ve Saklama Bankası', '0134': 'DenizBank',
  '0135': 'Anadolubank', '0137': 'Hepsi Bank', '0138': 'Diler Yatırım Bankası', '0139': 'GSD Yatırım Bankası',
  '0141': 'Nurol Yatırım Bankası', '0142': 'BankPozitif', '0143': 'Aktif Yatırım Bankası', '0146': 'Odeabank',
  '0147': 'MUFG Bank Turkey', '0148': 'Intesa Sanpaolo', '0149': 'Bank of China Turkey', '0151': 'D Yatırım Bankası',
  '0152': 'Destek Yatırım Bankası', '0153': 'Misyon Yatırım Bankası', '0154': 'Tera Yatırım Bankası', '0155': 'Q Yatırım Bankası',
  '0156': 'Hedef Yatırım Bankası', '0157': 'Enpara Bank', '0158': 'Colendi Bank', '0159': 'Fups Bank', '0160': 'Ziraat Dinamik Bankası',
  '0161': 'Aytemiz Yatırım Bankası', '0203': 'Albaraka Türk', '0205': 'Kuveyt Türk', '0206': 'Türkiye Finans',
  '0209': 'Ziraat Katılım', '0210': 'Vakıf Katılım', '0211': 'Türkiye Emlak Katılım', '0212': 'Hayat Finans',
  '0213': 'T.O.M. Katılım Bankası', '0214': 'Dünya Katılım Bankası', '0215': 'Adil Katılım Bankası', '0216': 'İktisat Katılım Bankası',
  '0806': 'Merkezi Kayıt Kuruluşu', '0807': 'PTT',
};

export interface IbanSonuc { gecerli: boolean; ulke: string; uzunlukUygun: boolean; bankaKodu: string | null; banka: string | null; bicimli: string; hata?: string }

/** ISO 13616 MOD-97 doğrulaması. TR IBAN'ı 26 karakterdir: TR + 2 kontrol + 5 banka kodu + 1 rezerv + 16 hesap. */
export function ibanDogrula(girdi: string): IbanSonuc {
  const t = girdi.replace(/[\s-]+/g, '').toUpperCase();
  const bicimli = t.replace(/(.{4})/g, '$1 ').trim();
  const ulke = t.slice(0, 2);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(t)) return { gecerli: false, ulke, uzunlukUygun: false, bankaKodu: null, banka: null, bicimli, hata: 'IBAN harf ve rakamlardan oluşmalı; ülke kodu ve 2 kontrol hanesiyle başlamalı.' };
  const uzunlukUygun = ulke === 'TR' ? t.length === 26 : t.length >= 15 && t.length <= 34;
  const yeniden = t.slice(4) + t.slice(0, 4);
  let mod = 0;
  for (const ch of yeniden) {
    const kod = ch >= 'A' && ch <= 'Z' ? String(ch.charCodeAt(0) - 55) : ch;
    for (const d of kod) mod = (mod * 10 + Number(d)) % 97;
  }
  const gecerli = mod === 1 && uzunlukUygun;
  let bankaKodu: string | null = null;
  let banka: string | null = null;
  if (ulke === 'TR' && t.length >= 9) {
    bankaKodu = t.slice(5, 9); // 5 haneli kodun ilk hanesi 0; EFT kodu son 4 hane
    banka = TR_BANKA_KODLARI[bankaKodu] ?? null;
  }
  return {
    gecerli, ulke, uzunlukUygun, bankaKodu, banka, bicimli,
    hata: !uzunlukUygun ? (ulke === 'TR' ? `TR IBAN'ı 26 karakter olmalı (${t.length} girildi).` : 'IBAN uzunluğu geçersiz.') : mod !== 1 ? 'Kontrol haneleri tutmuyor; IBAN’da hatalı karakter var.' : undefined,
  };
}

// ── Altın ─────────────────────────────────────────────────────────────

/** Darphane ziynet altınları: brüt ağırlık (gr), 22 ayar (0,916). Ons = 31,1034768 gr. */
export const ALTIN_TURLERI = {
  gram24: { ad: 'Gram altın (24 ayar)', gram: 1, milyem: 0.995 },
  gram22: { ad: 'Gram 22 ayar', gram: 1, milyem: 0.916 },
  gram18: { ad: 'Gram 18 ayar', gram: 1, milyem: 0.75 },
  gram14: { ad: 'Gram 14 ayar', gram: 1, milyem: 0.585 },
  ceyrek: { ad: 'Çeyrek altın', gram: 1.754, milyem: 0.916 },
  yarim: { ad: 'Yarım altın', gram: 3.508, milyem: 0.916 },
  tam: { ad: 'Tam altın', gram: 7.016, milyem: 0.916 },
  cumhuriyet: { ad: 'Cumhuriyet (Ata) altını', gram: 7.216, milyem: 0.916 },
  ons: { ad: 'Ons altın', gram: 31.1034768, milyem: 0.995 },
} as const;
export type AltinTuru = keyof typeof ALTIN_TURLERI;

/** Has altın içeriği (gr); 24 ayar gram fiyatı has fiyat kabul edilir (milyem 0,995 → 1 gram). */
export function hasIcerik(tur: AltinTuru, adet: number): number {
  const t = ALTIN_TURLERI[tur];
  return (adet * t.gram * t.milyem) / 0.995;
}
