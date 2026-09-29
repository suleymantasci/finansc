// ── Hesaplama araçlarının kullandığı resmi parametreler ─────────────────
//
// Her değerin yanında kaynağı var. Yeni dönem açıklandığında yalnızca bu
// dosya güncellenir; araçlar tarihe göre doğru dönemi kendisi seçer.
// Tarihler 'YYYY-MM-DD'. Tutarlar TL.

export interface DatedValue<T> {
  /** Bu tarihten (dahil) itibaren geçerli */
  from: string;
  value: T;
}

/** Tarihe göre geçerli değeri seçer (liste eskiden yeniye sıralı olmalı). */
export function valueAt<T>(list: DatedValue<T>[], date: string): T {
  let current = list[0].value;
  for (const item of list) {
    if (item.from <= date) current = item.value;
    else break;
  }
  return current;
}

// Kıdem tazminatı tavanı — ÇSGB / verginet.net "Kıdem Tazminatı Tavan Tutarları"
export const KIDEM_TAVANI: DatedValue<number>[] = [
  { from: '2020-01-01', value: 6730.15 },
  { from: '2020-07-01', value: 7117.17 },
  { from: '2021-01-01', value: 7638.96 },
  { from: '2021-07-01', value: 8284.51 },
  { from: '2022-01-01', value: 10848.59 },
  { from: '2022-07-01', value: 15371.4 },
  { from: '2023-01-01', value: 19982.83 },
  { from: '2023-07-01', value: 23489.83 },
  { from: '2024-01-01', value: 35058.58 },
  { from: '2024-07-01', value: 41828.42 },
  { from: '2025-01-01', value: 46655.43 },
  { from: '2025-07-01', value: 53919.68 },
  { from: '2026-01-01', value: 64948.77 },
  { from: '2026-07-01', value: 73729.87 },
];

// Brüt asgari ücret (aylık) — Asgari Ücret Tespit Komisyonu kararları
export const ASGARI_UCRET_BRUT: DatedValue<number>[] = [
  { from: '2024-01-01', value: 20002.5 },
  { from: '2025-01-01', value: 26005.5 },
  { from: '2026-01-01', value: 33030 },
];

// SGK prime esas kazanç üst sınırı: asgari ücretin katı (5510 md. 82).
// 7566 sayılı Kanun ile 1.1.2026'dan itibaren 9 kat (SGK "Prime Esas Kazanç Miktarları" 2026).
export const SGK_TAVAN_KATSAYI: DatedValue<number>[] = [
  { from: '2008-10-01', value: 6.5 },
  { from: '2023-01-01', value: 7.5 },
  { from: '2026-01-01', value: 9 },
];

// Çalışan kesintileri (4/a)
export const SGK_ISCI_ORANI = 0.14;
export const ISSIZLIK_ISCI_ORANI = 0.01;
export const ISSIZLIK_ISVEREN_ORANI = 0.02;
/** Damga vergisi — ücret ödemeleri ve kıdem/ihbar tazminatı: binde 7,59 */
export const DAMGA_UCRET = 0.00759;

// SGK işveren payı (4/a, teşviksiz). 2025: %20,75; 7566 sayılı Kanun ile 2026: %21,75
// (verginet.net SGK sirküleri 2026/1; alomaliye.com 2025–2026 karşılaştırma tablosu)
export const SGK_ISVEREN_ORANI: DatedValue<number>[] = [
  { from: '2024-01-01', value: 0.205 },
  { from: '2025-01-01', value: 0.2075 },
  { from: '2026-01-01', value: 0.2175 },
];

// Gelir vergisi tarifesi (GVK md. 103) — GİB "Gelir Vergisi Tarifesi 2026" ve önceki yıllar.
// limit = dilimin alt sınırı (kümülatif matrah).
export interface Bracket { limit: number; rate: number }
export interface GvTarife { ucret: Bracket[]; ucretDisi: Bracket[] }

export const GELIR_VERGISI_TARIFESI: Record<number, GvTarife> = {
  2024: {
    ucret: [
      { limit: 0, rate: 0.15 }, { limit: 110000, rate: 0.2 }, { limit: 230000, rate: 0.27 },
      { limit: 870000, rate: 0.35 }, { limit: 3000000, rate: 0.4 },
    ],
    ucretDisi: [
      { limit: 0, rate: 0.15 }, { limit: 110000, rate: 0.2 }, { limit: 230000, rate: 0.27 },
      { limit: 580000, rate: 0.35 }, { limit: 3000000, rate: 0.4 },
    ],
  },
  2025: {
    ucret: [
      { limit: 0, rate: 0.15 }, { limit: 158000, rate: 0.2 }, { limit: 330000, rate: 0.27 },
      { limit: 1200000, rate: 0.35 }, { limit: 4300000, rate: 0.4 },
    ],
    ucretDisi: [
      { limit: 0, rate: 0.15 }, { limit: 158000, rate: 0.2 }, { limit: 330000, rate: 0.27 },
      { limit: 800000, rate: 0.35 }, { limit: 4300000, rate: 0.4 },
    ],
  },
  2026: {
    ucret: [
      { limit: 0, rate: 0.15 }, { limit: 190000, rate: 0.2 }, { limit: 400000, rate: 0.27 },
      { limit: 1500000, rate: 0.35 }, { limit: 5300000, rate: 0.4 },
    ],
    ucretDisi: [
      { limit: 0, rate: 0.15 }, { limit: 190000, rate: 0.2 }, { limit: 400000, rate: 0.27 },
      { limit: 1000000, rate: 0.35 }, { limit: 5300000, rate: 0.4 },
    ],
  },
};
export const GV_YILLARI = Object.keys(GELIR_VERGISI_TARIFESI).map(Number).sort();
export const SON_GV_YILI = GV_YILLARI[GV_YILLARI.length - 1];

// Konut kira geliri istisnası (GVK md. 21) — GİB "Kira Geliri" rehberi, PKF
export const KONUT_KIRA_ISTISNASI: Record<number, number> = { 2024: 33000, 2025: 47000, 2026: 58000 };

// Damga vergisi (488 s. Kanun, 1 s. tablo) — 2026 oranları (verginet.net "Damga Vergisi Oran ve Tutarları")
export const DAMGA_ORANLARI = {
  sozlesme: 0.00948, // belli parayı ihtiva eden mukavelenameler, taahhütnameler, kefalet
  kira: 0.00189, // kira mukavelenameleri (süreye göre kira bedeli üzerinden)
  ucret: 0.00759, // maaş, ücret, gündelik
};
/** Bir kâğıt için azami damga vergisi (2026) */
export const DAMGA_AZAMI_2026 = 29115961.1;

// Stopaj ve vergi oranları
export const KIRA_STOPAJ_ORANI = 0.2; // GVK 94/5-a
export const SMM_STOPAJ_ORANI = 0.2; // GVK 94/2-b serbest meslek
export const TEMETTU_STOPAJ_ORANI = 0.15; // 22.12.2024'ten itibaren %15 (9286 s. CBK)
export const KDV_ORANLARI = [1, 10, 20];

// Gecikme zammı (6183 md. 51) — aylık oran; ay kesirleri gün hesabıyla (oran/30).
// Kaynak: PKF İstanbul "Gecikme Zammı ve Gecikme Faizi Oranları"
export const GECIKME_ZAMMI_AYLIK: DatedValue<number>[] = [
  { from: '2019-07-01', value: 0.025 },
  { from: '2019-10-02', value: 0.02 },
  { from: '2019-12-30', value: 0.016 },
  { from: '2022-07-21', value: 0.025 },
  { from: '2023-11-14', value: 0.035 },
  { from: '2024-05-21', value: 0.045 },
  { from: '2025-11-13', value: 0.037 },
];

// Kanuni (yasal) faiz — 3095 s. Kanun md. 1. %24: 8485 s. CBK (1.6.2024);
// %31: 7589 s. Kanun (12. Yargı Paketi), RG 31.7.2026, aynı gün yürürlük.
export const KANUNI_FAIZ_YILLIK: DatedValue<number>[] = [
  { from: '2006-01-01', value: 0.09 },
  { from: '2024-06-01', value: 0.24 },
  { from: '2026-07-31', value: 0.31 },
];

// İşsizlik ödeneği (4447 md. 50): günlük ort. brüt kazancın %40'ı, brüt asgari ücretin %80'ini aşamaz.
export const ISSIZLIK_ORAN = 0.4;
export const ISSIZLIK_TAVAN_ORAN = 0.8;

// Hizmet borçlanması prim oranları — 7566 s. Kanun ile 1.1.2026'dan itibaren (SGMD)
export const BORCLANMA_ORANI = { dogum: 0.32, askerlik: 0.45, yurtdisi: 0.45 } as const;
export const BORCLANMA_ORANI_2025 = { dogum: 0.32, askerlik: 0.32, yurtdisi: 0.45 } as const;
/** Doğum borçlanması: her doğum için en çok 2 yıl (720 gün), en fazla 3 doğum */
export const DOGUM_BORCLANMA_GUN_LIMIT = 720;

// BES devlet katkısı — 7.1.2026 tarihli CBK ile 1.1.2026'dan itibaren %20;
// yıllık üst sınır: yıllık brüt asgari ücretin %20'si.
export const BES_DEVLET_KATKISI: DatedValue<number>[] = [
  { from: '2013-01-01', value: 0.25 },
  { from: '2022-01-01', value: 0.3 },
  { from: '2026-01-01', value: 0.2 },
];
/** Devlet katkısı hak ediş oranları (sistemde kalınan yıl) */
export const BES_HAK_EDIS = [
  { years: 0, rate: 0 },
  { years: 3, rate: 0.15 },
  { years: 6, rate: 0.35 },
  { years: 10, rate: 0.6 },
];

// Tapu harcı (492 s. Harçlar K. 4 s. tarife 20/a): alıcı ve satıcıdan ayrı ayrı binde 20
export const TAPU_HARCI_ORANI = 0.02;
/** 2026 tapu döner sermaye: gösterge 2.227 TL × yöresel katsayı (0,30–3,00) */
export const TAPU_DONER_SERMAYE_2026 = { gosterge: 2227, min: 668.1, max: 6681 };

// Emlak vergisi (1319 s. K. md. 8, 18): binde; büyükşehir ve mücavir alanda %100 artırımlı
export const EMLAK_VERGISI_ORANLARI = {
  konut: 0.001,
  isyeri: 0.002,
  arsa: 0.003,
  arazi: 0.001,
} as const;

// Emlakçı hizmet bedeli (Taşınmaz Ticareti Hakkında Yönetmelik md. 20):
// satışta alıcı ve satıcıdan ayrı ayrı en çok %2 + KDV; kiralamada toplam en çok 1 aylık kira + KDV.
export const EMLAKCI_SATIS_ORANI = 0.02;
export const KDV_GENEL = 0.2;

// Yıllık ücretli izin (4857 md. 53)
export const YILLIK_IZIN = { kademe1: 14, kademe2: 20, kademe3: 26, yasIstisnasi: 20, yeraltiEk: 4 };

// Doğum (analık) izni — 4857 md. 74, 7578 s. Kanun (RG 1.5.2026): doğumdan önce 8, sonra 16 hafta;
// çoğul gebelikte doğum öncesine 2 hafta eklenir. Öncesi: 8 + 8 hafta.
export const DOGUM_IZNI = {
  oncesiHafta: 8,
  sonrasiHafta: 16,
  sonrasiHaftaEski: 8,
  cogulEkHafta: 2,
  yeniKuralTarihi: '2026-05-01',
};

// Resmî tatiller (2394 s. Kanun) — arife günleri 13.00'ten sonra yarım gün.
// Kaynak: Diyanet takvimi / harbiyehukuk.com "2027 ve 2026 Yılı Resmi Tatil Günleri"
export const RESMI_TATILLER: { date: string; name: string; half?: boolean }[] = [
  { date: '2025-01-01', name: 'Yılbaşı' },
  { date: '2025-03-29', name: 'Ramazan Bayramı arifesi', half: true },
  { date: '2025-03-30', name: 'Ramazan Bayramı 1. gün' },
  { date: '2025-03-31', name: 'Ramazan Bayramı 2. gün' },
  { date: '2025-04-01', name: 'Ramazan Bayramı 3. gün' },
  { date: '2025-04-23', name: 'Ulusal Egemenlik ve Çocuk Bayramı' },
  { date: '2025-05-01', name: 'Emek ve Dayanışma Günü' },
  { date: '2025-05-19', name: 'Atatürk’ü Anma, Gençlik ve Spor Bayramı' },
  { date: '2025-06-05', name: 'Kurban Bayramı arifesi', half: true },
  { date: '2025-06-06', name: 'Kurban Bayramı 1. gün' },
  { date: '2025-06-07', name: 'Kurban Bayramı 2. gün' },
  { date: '2025-06-08', name: 'Kurban Bayramı 3. gün' },
  { date: '2025-06-09', name: 'Kurban Bayramı 4. gün' },
  { date: '2025-07-15', name: 'Demokrasi ve Millî Birlik Günü' },
  { date: '2025-08-30', name: 'Zafer Bayramı' },
  { date: '2025-10-28', name: 'Cumhuriyet Bayramı arifesi', half: true },
  { date: '2025-10-29', name: 'Cumhuriyet Bayramı' },
  { date: '2026-01-01', name: 'Yılbaşı' },
  { date: '2026-03-19', name: 'Ramazan Bayramı arifesi', half: true },
  { date: '2026-03-20', name: 'Ramazan Bayramı 1. gün' },
  { date: '2026-03-21', name: 'Ramazan Bayramı 2. gün' },
  { date: '2026-03-22', name: 'Ramazan Bayramı 3. gün' },
  { date: '2026-04-23', name: 'Ulusal Egemenlik ve Çocuk Bayramı' },
  { date: '2026-05-01', name: 'Emek ve Dayanışma Günü' },
  { date: '2026-05-19', name: 'Atatürk’ü Anma, Gençlik ve Spor Bayramı' },
  { date: '2026-05-26', name: 'Kurban Bayramı arifesi', half: true },
  { date: '2026-05-27', name: 'Kurban Bayramı 1. gün' },
  { date: '2026-05-28', name: 'Kurban Bayramı 2. gün' },
  { date: '2026-05-29', name: 'Kurban Bayramı 3. gün' },
  { date: '2026-05-30', name: 'Kurban Bayramı 4. gün' },
  { date: '2026-07-15', name: 'Demokrasi ve Millî Birlik Günü' },
  { date: '2026-08-30', name: 'Zafer Bayramı' },
  { date: '2026-10-28', name: 'Cumhuriyet Bayramı arifesi', half: true },
  { date: '2026-10-29', name: 'Cumhuriyet Bayramı' },
  { date: '2027-01-01', name: 'Yılbaşı' },
  { date: '2027-03-08', name: 'Ramazan Bayramı arifesi', half: true },
  { date: '2027-03-09', name: 'Ramazan Bayramı 1. gün' },
  { date: '2027-03-10', name: 'Ramazan Bayramı 2. gün' },
  { date: '2027-03-11', name: 'Ramazan Bayramı 3. gün' },
  { date: '2027-04-23', name: 'Ulusal Egemenlik ve Çocuk Bayramı' },
  { date: '2027-05-01', name: 'Emek ve Dayanışma Günü' },
  { date: '2027-05-15', name: 'Kurban Bayramı arifesi', half: true },
  { date: '2027-05-16', name: 'Kurban Bayramı 1. gün' },
  { date: '2027-05-17', name: 'Kurban Bayramı 2. gün' },
  { date: '2027-05-18', name: 'Kurban Bayramı 3. gün' },
  { date: '2027-05-19', name: 'Kurban Bayramı 4. gün, Gençlik ve Spor Bayramı' },
  { date: '2027-07-15', name: 'Demokrasi ve Millî Birlik Günü' },
  { date: '2027-08-30', name: 'Zafer Bayramı' },
  { date: '2027-10-28', name: 'Cumhuriyet Bayramı arifesi', half: true },
  { date: '2027-10-29', name: 'Cumhuriyet Bayramı' },
];
export const TATIL_KAPSAMI = { from: '2025-01-01', to: '2027-12-31' };

// Altın ayar milyemleri (has altın oranı) — Kuyumcular piyasası standardı
export const ALTIN_MILYEM: Record<string, number> = {
  '24': 0.995,
  '22': 0.916,
  '21': 0.875,
  '18': 0.75,
  '14': 0.585,
  '8': 0.333,
};
