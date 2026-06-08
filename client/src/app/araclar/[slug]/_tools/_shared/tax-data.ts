// ── Türkiye Maaş Hesaplama Mevzuat Verileri (2024-2026) ──
//
// Kaynak: Gelir İdaresi Başkanlığı (GİB), Sosyal Güvenlik Kurumu (SGK),
// Resmi Gazete. Yeni yıl eklendiğinde bu dosyaya
// TAX_DATA[<yıl>] entry'si eklemek yeterli — hesaplama motoru yıl
// parametresi ile otomatik doğru oranları seçer.
//
// NOT: AGİ (Asgari Geçim İndirimi) 2022 yılından itibaren kaldırılmıştır.
// Yerine asgari ücret istisnası uygulanmaktadır.
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

export type DisabilityDegree = 'yok' | 'birinci' | 'ikinci' | 'ucuncu';

export interface TaxBracket {
  /** Alt sınır (kümülatif matrah) TL */
  limit: number;
  /** Bu dilimde uygulanan oran (0.15 = %15) */
  rate: number;
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
  /** Engellilik indirimi (yıllık, TL) */
  disabilityDeduction: Record<DisabilityDegree, number>;
  /** SGK tavan (aylık üst sınır TL) — brüt asgari ücretin 7.5 katı */
  sgkCeilingMultiplier: number;
  /** Asgari ücret istisnası uygulanıyor mu? (2022'den beri evet) */
  minimumWageExemption: boolean;
}

// ── 2024 Verileri ─────────────────────────────────────────────────

const taxData2024: TaxDataYear = {
  year: 2024,
  minWageBrut: 20002.50,
  minWageNet: 17002.12,
  sgkEmployee: 0.14,
  sgkEmployer: 0.205,
  unemploymentEmployee: 0.01,
  unemploymentEmployer: 0.02,
  stampTax: 0.00759, // ‰7.59
  incomeTaxBrackets: [
    { limit: 0,          rate: 0.15 },
    { limit: 110000,     rate: 0.20 },
    { limit: 230000,     rate: 0.27 },
    { limit: 870000,     rate: 0.35 },
    { limit: 3000000,    rate: 0.40 },
  ],
  disabilityDeduction: { yok: 0, birinci: 69000, ikinci: 40000, ucuncu: 17000 },
  sgkCeilingMultiplier: 7.5,
  minimumWageExemption: true,
};

// ── 2025 Verileri (1 Ocak 2025 itibarıyla) ─────────────────────────

const taxData2025: TaxDataYear = {
  year: 2025,
  minWageBrut: 26005.50,
  minWageNet: 22104.67,
  sgkEmployee: 0.14,
  sgkEmployer: 0.205,
  unemploymentEmployee: 0.01,
  unemploymentEmployer: 0.02,
  stampTax: 0.00759, // ‰7.59
  incomeTaxBrackets: [
    { limit: 0,          rate: 0.15 },
    { limit: 158000,     rate: 0.20 },
    { limit: 330000,     rate: 0.27 },
    { limit: 1200000,    rate: 0.35 },
    { limit: 4300000,    rate: 0.40 },
  ],
  disabilityDeduction: { yok: 0, birinci: 91000, ikinci: 53000, ucuncu: 22000 },
  sgkCeilingMultiplier: 7.5,
  minimumWageExemption: true,
};

// ── 2026 Verileri (1 Ocak 2026 itibarıyla) ─────────────────────

const taxData2026: TaxDataYear = {
  year: 2026,
  minWageBrut: 33030.00,
  minWageNet: 28075.50,
  sgkEmployee: 0.14,
  sgkEmployer: 0.205,
  unemploymentEmployee: 0.01,
  unemploymentEmployer: 0.02,
  stampTax: 0.00759,
  incomeTaxBrackets: [
    { limit: 0,          rate: 0.15 },
    { limit: 190000,     rate: 0.20 },
    { limit: 400000,     rate: 0.27 },
    { limit: 1500000,    rate: 0.35 },
    { limit: 5300000,    rate: 0.40 },
  ],
  disabilityDeduction: { yok: 0, birinci: 120000, ikinci: 70000, ucuncu: 29000 },
  sgkCeilingMultiplier: 7.5,
  minimumWageExemption: true,
};

// ── Yıl indexi + erişim ───────────────────────────────────────────

export const TAX_DATA: Record<number, TaxDataYear> = {
  2024: taxData2024,
  2025: taxData2025,
  2026: taxData2026,
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
  disability: z.enum(['yok', 'birinci', 'ikinci', 'ucuncu']),
  /** Kümülatif gelir vergisi matrahı (yıl başından beri) */
  cumulativeMatrah: z.coerce.number().min(0),
  /** Asgari ücret istisnasi kümülatif matrahı */
  minWageCumulativeMatrah: z.coerce.number().min(0),
  /** İşveren maliyetini göster */
  showEmployerCost: z.boolean(),
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

export const DISABILITY_LABELS: Record<DisabilityDegree, string> = {
  yok: 'Yok',
  birinci: '1. derece (tam)',
  ikinci: '2. derece (kısmi)',
  ucuncu: '3. derece',
};
