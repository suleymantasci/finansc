// ── Türkiye Maaş Hesaplama Mevzuat Verileri (2024-2025) ──
//
// Kaynak: Gelir İdaresi Başkanlığı (GİB), Sosyal Güvenlik Kurumu (SGK),
// Resmi Gazete. 2026 yılı değerleri Aralık 2025/Ocak 2026'da
// Resmi Gazete ile açıklanır; yeni yıl eklendiğinde bu dosyaya
// TAX_DATA[<yıl>] entry'si eklemek yeterli — hesaplama motoru yıl
// parametresi ile otomatik doğru oranları seçer.
//
// 2025 değerleri 1 Ocak 2025 itibarıyla geçerli. Asgari ücret istisnası
// 2022'den beri uygulanıyor (Türkiye Yüzyılı paketi), AGİ dahil değil.
// 4/a (SSK) ücretli çalışan için hesaplama yapılır; 4/b (Bağ-Kur) ve
// 4/c (Memur) için farklı oranlar/istisnalar ayrıca modelledi.
//
// Tüm tutarlar aylık TL cinsindendir. Oranlar ondalık (0.14) formattadır.

import { z } from 'zod';

// ── Tipler ─────────────────────────────────────────────────────────

export type EmployeeType =
  | '4a-ucretli'        // 4/a SSK Ücretli (en yaygın)
  | '4a-emekli'         // 4/a SSK Emekli (yeniden çalışan)
  | '4b-esnaf'          // 4/b Bağ-Kur Esnaf
  | '4c-memur'          // 4/c Memur
  | '4a-stajyer'        // 4/a Stajyer/Çırak
  | '4a-ev-hizmet-10'   // 4/a Ev Hizmetleri 10 gün
  | '4a-ev-hizmet-30';  // 4/a Ev Hizmetleri 30 gün

export type MaritalStatus = 'bekar' | 'evli-es-calismiyor' | 'evli-es-calisiyor';

export type DisabilityDegree = 'yok' | 'birinci' | 'ikinci' | 'ucuncu';

export interface TaxBracket {
  /** Alt sınır (kümülatif matrah) TL */
  limit: number;
  /** Bu dilimde uygulanan oran (0.15 = %15) */
  rate: number;
}

export interface AgiRow {
  /** Yıllık AGİ (TL/yıl) — Gelir İdaresi'nin yayımladığı tam yıllık tutar */
  annual: number;
}

export interface TaxDataYear {
  year: number;
  /** Asgari ücret brüt (TL/ay) */
  minWageBrut: number;
  /** Asgari ücret net (TL/ay) */
  minWageNet: number;
  /** SGK işçi primi oranı */
  sgkEmployee: number;
  /** SGK işveren primi oranı */
  sgkEmployer: number;
  /** İşsizlik sigortası işçi */
  unemploymentEmployee: number;
  /** İşsizlik sigortası işveren */
  unemploymentEmployer: number;
  /** Damga vergisi bindesi (0.00759 = ‰7.59) */
  stampTax: number;
  /** Gelir vergisi dilimleri (ücretli, kümülatif matrah) */
  incomeTaxBrackets: TaxBracket[];
  /** AGİ tablosu (16 kombinasyon: medeni durum × çocuk sayısı) */
  agiTable: Record<MaritalStatus, Record<0 | 1 | 2 | 3 | 4, AgiRow>>;
  /** Engellilik indirimi (yıllık, TL) */
  disabilityDeduction: Record<DisabilityDegree, number>;
  /** SGK tavan (aylık üst sınır TL) — brüt asgari ücretin 7.5 katı */
  sgkCeilingMultiplier: number;
  /** Asgari ücret istisnası uygulanıyor mu? (2022'den beri evet) */
  minimumWageExemption: boolean;
}

// ── 2024 Verileri ─────────────────────────────────────────────────

const agi2024Table: Record<MaritalStatus, Record<0 | 1 | 2 | 3 | 4, AgiRow>> = {
  'bekar':                  { 0: { annual: 13250.40 }, 1: { annual: 18929.28 }, 2: { annual: 22608.12 }, 3: { annual: 25530.48 }, 4: { annual: 25530.48 } },
  'evli-es-calismiyor':     { 0: { annual: 18929.28 }, 1: { annual: 22608.12 }, 2: { annual: 25530.48 }, 3: { annual: 28452.84 }, 4: { annual: 28452.84 } },
  'evli-es-calisiyor':      { 0: { annual: 15143.04 }, 1: { annual: 18929.28 }, 2: { annual: 22608.12 }, 3: { annual: 25530.48 }, 4: { annual: 25530.48 } },
};

const taxData2024: TaxDataYear = {
  year: 2024,
  minWageBrut: 20002.50,
  minWageNet: 17002.12,
  sgkEmployee: 0.14,
  sgkEmployer: 0.155,
  unemploymentEmployee: 0.01,
  unemploymentEmployer: 0.02,
  stampTax: 0.00759, // ‰7.59
  incomeTaxBrackets: [
    { limit: 0,         rate: 0.15 },
    { limit: 110000,    rate: 0.20 },
    { limit: 230000,    rate: 0.27 },
    { limit: 580000,    rate: 0.35 },
  ],
  agiTable: agi2024Table,
  disabilityDeduction: { yok: 0, birinci: 69000, ikinci: 40000, ucuncu: 17000 },
  sgkCeilingMultiplier: 7.5,
  minimumWageExemption: true,
};

// ── 2025 Verileri (1 Ocak 2025 itibarıyla) ─────────────────────────

const agi2025Table: Record<MaritalStatus, Record<0 | 1 | 2 | 3 | 4, AgiRow>> = {
  'bekar':                  { 0: { annual: 16563.00 }, 1: { annual: 23661.60 }, 2: { annual: 28260.12 }, 3: { annual: 31913.16 }, 4: { annual: 31913.16 } },
  'evli-es-calismiyor':     { 0: { annual: 23661.60 }, 1: { annual: 28260.12 }, 2: { annual: 31913.16 }, 3: { annual: 35566.20 }, 4: { annual: 35566.20 } },
  'evli-es-calisiyor':      { 0: { annual: 18929.28 }, 1: { annual: 23661.60 }, 2: { annual: 28260.12 }, 3: { annual: 31913.16 }, 4: { annual: 31913.16 } },
};

const taxData2025: TaxDataYear = {
  year: 2025,
  minWageBrut: 26005.50,
  minWageNet: 22104.67,
  sgkEmployee: 0.14,
  sgkEmployer: 0.155,
  unemploymentEmployee: 0.01,
  unemploymentEmployer: 0.02,
  stampTax: 0.00759, // ‰7.59
  incomeTaxBrackets: [
    { limit: 0,         rate: 0.15 },
    { limit: 158000,    rate: 0.20 },
    { limit: 330000,    rate: 0.27 },
    { limit: 800000,    rate: 0.35 },
  ],
  agiTable: agi2025Table,
  disabilityDeduction: { yok: 0, birinci: 91000, ikinci: 53000, ucuncu: 22000 },
  sgkCeilingMultiplier: 7.5,
  minimumWageExemption: true,
};

// ── Yıl indexi + erişim ───────────────────────────────────────────

export const TAX_DATA: Record<number, TaxDataYear> = {
  2024: taxData2024,
  2025: taxData2025,
};

export const AVAILABLE_YEARS: number[] = Object.keys(TAX_DATA).map(Number).sort();

export function getTaxData(year: number): TaxDataYear {
  return TAX_DATA[year] ?? TAX_DATA[AVAILABLE_YEARS[AVAILABLE_YEARS.length - 1]];
}

// ── Form Şeması (Zod) ─────────────────────────────────────────────

export const maasFormSchema = z.object({
  year: z.coerce.number().int().min(2024).max(2099),
  month: z.coerce.number().int().min(1).max(12),
  direction: z.enum(['brutten-nete', 'netten-brute']),
  employeeType: z.enum(['4a-ucretli', '4a-emekli', '4b-esnaf', '4c-memur', '4a-stajyer', '4a-ev-hizmet-10', '4a-ev-hizmet-30']),
  amount: z.coerce.number().min(1, 'Maaş tutarı giriniz'),
  maritalStatus: z.enum(['bekar', 'evli-es-calismiyor', 'evli-es-calisiyor']),
  childCount: z.coerce.number().int().min(0).max(10),
  disability: z.enum(['yok', 'birinci', 'ikinci', 'ucuncu']),
  /** Kümülatif gelir vergisi matrahı (yıl başından beri) */
  cumulativeMatrah: z.coerce.number().min(0).default(0),
  /** İşveren maliyetini göster */
  showEmployerCost: z.boolean().default(false),
});

export type MaasFormData = z.infer<typeof maasFormSchema>;

// ── Çalışan Etiketleri (UI için) ─────────────────────────────────

export const EMPLOYEE_TYPE_LABELS: Record<EmployeeType, string> = {
  '4a-ucretli':     '4/a SSK Ücretli',
  '4a-emekli':      '4/a SSK Emekli (yeniden çalışan)',
  '4b-esnaf':       '4/b Bağ-Kur Esnaf',
  '4c-memur':       '4/c Memur',
  '4a-stajyer':     '4/a Stajyer/Çırak',
  '4a-ev-hizmet-10':'4/a Ev Hizmetleri (10 gün üzeri)',
  '4a-ev-hizmet-30':'4/a Ev Hizmetleri (30 gün üzeri)',
};

export const MARITAL_STATUS_LABELS: Record<MaritalStatus, string> = {
  'bekar':              'Bekâr',
  'evli-es-calismiyor': 'Evli (eş çalışmıyor)',
  'evli-es-calisiyor':  'Evli (eş çalışıyor)',
};

export const DISABILITY_LABELS: Record<DisabilityDegree, string> = {
  yok: 'Yok',
  birinci: '1. derece (tam)',
  ikinci: '2. derece (kısmi)',
  ucuncu: '3. derece',
};

// ── AGİ aylık tutar (yardımcı) ───────────────────────────────────

export function getAgiMonthly(year: number, m: MaritalStatus, children: number): number {
  const td = getTaxData(year);
  const c = Math.min(4, Math.max(0, children)) as 0 | 1 | 2 | 3 | 4;
  return td.agiTable[m][c].annual / 12;
}
