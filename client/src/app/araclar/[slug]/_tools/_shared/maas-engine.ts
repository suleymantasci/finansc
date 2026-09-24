// ── Maaş Hesaplama Motoru (Brütten Nete / Netten Brüte) ────────────
//
// Türkiye'de ücretli çalışanlar (4/a) için standart hesaplama akışı:
//   1) Brüt maaş
//   2) SGK primi (işçi %14) + İşsizlik sigortası (işçi %1) kesilir
//   3) Kalan tutar = Gelir vergisi matrahı
//   4) Kümülatif matrah dikkate alınarak gelir vergisi dilimleri uygulanır
//   5) Asgari ücret istisnası (varsa) gelir vergisinden düşülür
//   6) Damga vergisi (binde 7,59) brüt üzerinden hesaplanır
//   7) Net maaş = Brüt - (SGK + İşsizlik + Gelir Vergisi + Damga)
//   8) İşveren maliyeti = Brüt + SGK işveren + İşsizlik işveren
//
// Stajyer/Çırak: SGK %7, gelir vergisi muaf, damga vergisi muaf
// Ev Hizmetleri 10 gün: SGK muaf, gelir vergisi var
// Ev Hizmetleri 30 gün: 4/a normal (ilk 10 gün muaf sonra tam)
// Emekli: SGK kesilir (işveren kısmi), gelir vergisi var
// Bağ-Kur/Memur: ayrı modeller (basitleştirilmiş)

import {
  getTaxData,
  type MaasFormData,
  type TaxDataYear,
  type EmployeeType,
} from './tax-data';

// ── Tipler ─────────────────────────────────────────────────────────

/** Kuruş hassasiyetinde yuvarlama (2 ondalık) */
function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

export interface MaasLineItem {
  label: string;
  amount: number;
  /** Yüzde (brüt üzerinden, sadece kesintiler için) */
  rate?: number;
  /** Vurgu satırı mı (NET MAAŞ, İŞVEREN MALİYETİ) */
  highlight?: boolean;
  /** Pozitif (+) gelir mi, negatif (-) gider mi */
  kind: 'income' | 'deduction' | 'employer' | 'info';
}

export interface MaasResult {
  gross: number;               // Brüt maaş
  net: number;                 // Net maaş (en önemli)
  totalDeduction: number;      // Toplam işçi kesintisi
  totalEmployerCost: number;   // Toplam işveren maliyeti (opsiyonel)
  cumulativeMatrah: number;    // Bu ay sonrası kümülatif matrah
  minWageCumulativeMatrah: number; // Asgari ücret istisnası kümülatif matrahı
  lines: MaasLineItem[];       // Detay tablosu
  warnings: string[];          // Tavan, muafiyet vb. uyarılar
}

// ── Brütten Nete Hesaplama ───────────────────────────────────────

export function bruttenNete(form: MaasFormData): MaasResult {
  const td = getTaxData(form.year);
  const gross = form.amount;
  const warnings: string[] = [];
  const lines: MaasLineItem[] = [];

  // Tavan kontrolü
  const ceiling = round2(td.minWageBrut * td.sgkCeilingMultiplier);
  const sgkBase = Math.min(gross, ceiling);

  // ── 1) SGK primi (işçi) ──
  const sgkEmployeeRate = getSgkEmployeeRate(form.employeeType);
  const sgkEmployee = round2(sgkBase * sgkEmployeeRate);
  lines.push({
    label: 'SGK Primi (işçi)',
    amount: sgkEmployee,
    rate: sgkEmployeeRate,
    kind: 'deduction',
  });

  // ── 2) İşsizlik sigortası (işçi) ──
  const unemploymentRate = getUnemploymentEmployeeRate(form.employeeType);
  const unemployment = round2(sgkBase * unemploymentRate);
  if (unemployment > 0) {
    lines.push({
      label: 'İşsizlik Sigortası (işçi)',
      amount: unemployment,
      rate: unemploymentRate,
      kind: 'deduction',
    });
  }

  // ── 3) Gelir vergisi matrahı (ham) ──
  const rawMatrah = round2(gross - sgkEmployee - unemployment);

  // ── 4) Engellilik indirimi (matrahtan düşülür — GVK md. 31) ──
  const disabilityAnnual = td.disabilityDeduction[form.disability] || 0;
  const disabilityMonthly = round2(disabilityAnnual / 12);
  let disabilityApplied = 0;
  if (disabilityMonthly > 0) {
    disabilityApplied = Math.min(disabilityMonthly, rawMatrah);
    lines.push({
      label: `Engellilik İndirimi (${form.disability} derece)`,
      amount: -disabilityApplied,
      kind: 'info',
    });
  }
  const matrah = round2(rawMatrah - disabilityApplied);

  lines.push({
    label: 'Gelir Vergisi Matrahı',
    amount: matrah,
    kind: 'info',
  });

  // ── 5) Gelir vergisi (kümülatif matrah dahil) ──
  const incomeTax = round2(calculateIncomeTax(matrah, form.cumulativeMatrah, td));
  lines.push({
    label: 'Hesaplanan Gelir Vergisi',
    amount: incomeTax,
    kind: 'deduction',
  });

  // ── 6) Asgari ücret istisnası ──
  const minWageMatrah = round2(td.minWageBrut * (1 - sgkEmployeeRate - unemploymentRate));
  const minWageCumBefore = form.minWageCumulativeMatrah ?? 0;
  const minWageCumAfter = round2(minWageCumBefore + minWageMatrah);
  let minimumWageExemption = 0;
  if (td.minimumWageExemption && gross <= td.minWageBrut) {
    // Asgari ücretlinin gelir vergisi tamamen muaf
    minimumWageExemption = incomeTax;
    lines.push({
      label: 'Asgari Ücret İstisnası (gelir vergisi muafiyeti)',
      amount: -minimumWageExemption,
      kind: 'info',
    });
  } else if (td.minimumWageExemption) {
    // Kümülatif asgari ücret matrahı üzerinden vergi farkı ile istisna hesapla
    const exemptionTax = round2(calculateIncomeTax(minWageMatrah, minWageCumBefore, td));
    minimumWageExemption = Math.min(exemptionTax, incomeTax);
    if (minimumWageExemption > 0) {
      lines.push({
        label: 'Asgari Ücret İstisnası (kısmi)',
        amount: -minimumWageExemption,
        kind: 'info',
      });
    }
  }

  // ── 7) Damga vergisi ──
  const stampTax = round2(getStampTax(gross, form.employeeType, td));
  if (stampTax > 0) {
    lines.push({
      label: 'Damga Vergisi (binde 7,59)',
      amount: stampTax,
      rate: td.stampTax,
      kind: 'deduction',
    });
  }

  // ── 8) Net maaş ──
  const incomeTaxAfter = round2(incomeTax - minimumWageExemption);
  const totalDeduction = round2(sgkEmployee + unemployment + incomeTaxAfter + stampTax);
  const net = round2(gross - totalDeduction);

  lines.push({
    label: 'NET MAAŞ',
    amount: net,
    kind: 'income',
    highlight: true,
  });

  // ── 9) İşveren maliyeti (opsiyonel) ──
  let totalEmployerCost = gross;
  if (form.showEmployerCost) {
    const sgkEmployer = round2(sgkBase * td.sgkEmployer);
    const unemploymentEmployer = round2(sgkBase * td.unemploymentEmployer);
    lines.push({
      label: 'SGK Primi (işveren)',
      amount: sgkEmployer,
      rate: td.sgkEmployer,
      kind: 'employer',
    });
    lines.push({
      label: 'İşsizlik Sigortası (işveren)',
      amount: unemploymentEmployer,
      rate: td.unemploymentEmployer,
      kind: 'employer',
    });
    totalEmployerCost = round2(gross + sgkEmployer + unemploymentEmployer);
    lines.push({
      label: 'TOPLAM İŞVEREN MALİYETİ',
      amount: totalEmployerCost,
      kind: 'employer',
      highlight: true,
    });
  }

  // Uyarılar
  if (gross > ceiling) {
    warnings.push(`SGK tavanı aşıldı (${ceiling.toLocaleString('tr-TR')} TL). ${(gross - ceiling).toLocaleString('tr-TR')} TL üzerinden SGK kesilmez.`);
  }
  if (form.employeeType === '4a-stajyer' && gross > td.minWageBrut) {
    warnings.push('Stajyer ücreti asgari ücretten yüksek olamaz.');
  }
  if (form.employeeType === '4a-ev-hizmet-10' && form.amount > 0) {
    warnings.push('Ev hizmetleri 10 gün üzeri çalışmada SGK primi uygulanmaz, gelir vergisi ve damga vergisi uygulanır.');
  }
  if (form.employeeType === '4a-ev-hizmet-30') {
    warnings.push('Ev hizmetleri 30 gün üzeri çalışmada 4/a tam kesinti uygulanır.');
  }

  return {
    gross,
    net,
    totalDeduction,
    totalEmployerCost: form.showEmployerCost ? totalEmployerCost : gross,
    cumulativeMatrah: form.cumulativeMatrah + matrah,
    minWageCumulativeMatrah: minWageCumAfter,
    lines,
    warnings,
  };
}

// ── Netten Brüte Hesaplama (ters, iteratif) ──────────────────────

export function nettenBrute(form: MaasFormData): MaasResult {
  // Net maaşı veren brüt maaşı bul (binary search, brüt > net olduğu için
  // brüt/net oranı tipik 1.30-1.45 arası, başlangıç 1.35 ile başla)
  let low = form.amount;
  let high = form.amount * 2;
  let bestBrut = form.amount * 1.35;
  const tolerance = 0.01; // 1 kuruş

  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    const trial = bruttenNete({ ...form, amount: mid, direction: 'brutten-nete' });
    if (Math.abs(trial.net - form.amount) < tolerance) {
      bestBrut = mid;
      break;
    }
    if (trial.net < form.amount) {
      low = mid;
    } else {
      high = mid;
    }
    bestBrut = mid;
  }

  const result = bruttenNete({ ...form, amount: bestBrut, direction: 'brutten-nete' });
  // İlk satırı "Hedef Net Maaş" olarak işaretle
  result.lines.unshift({
    label: 'Hedef Net Maaş',
    amount: form.amount,
    kind: 'info',
  });
  return result;
}

// ── Gelir Vergisi Hesaplama (Kümülatif Matrah Dahil) ──────────────

function calculateIncomeTax(
  monthlyMatrah: number,
  cumulativeBefore: number,
  td: TaxDataYear,
): number {
  // Aylık matrahı yıl başından beri kümülatif matraha ekle, dilimleri
  // sırayla uygula, bu aya düşen kısmı topla. Negatif/0 matrah → 0 vergi.
  if (monthlyMatrah <= 0) return 0;
  const cumulativeAfter = Math.max(0, cumulativeBefore + monthlyMatrah);
  const taxBefore = taxOnCumulative(Math.max(0, cumulativeBefore), td);
  const taxAfter = taxOnCumulative(cumulativeAfter, td);
  return Math.max(0, taxAfter - taxBefore);
}

function taxOnCumulative(matrah: number, td: TaxDataYear): number {
  if (matrah <= 0) return 0;
  let tax = 0;
  const brackets = td.incomeTaxBrackets;
  for (let i = 0; i < brackets.length; i++) {
    const cur = brackets[i];
    const next = brackets[i + 1];
    if (matrah > cur.limit) {
      const upperBound = next ? Math.min(next.limit, matrah) : matrah;
      const span = upperBound - cur.limit;
      tax += span * cur.rate;
    } else {
      break;
    }
  }
  return tax;
}

// ── Çalışan Türüne Göre Oran ─────────────────────────────────────

function getSgkEmployeeRate(type: EmployeeType): number {
  switch (type) {
    case '4a-ucretli':       return 0.14;
    case '4a-emekli':        return 0.14;
    case '4b-esnaf':         return 0.20;
    case '4c-memur':         return 0.16;
    case '4a-stajyer':       return 0.07;
    case '4a-ev-hizmet-10':  return 0;
    case '4a-ev-hizmet-30':  return 0.14;
  }
}

function getUnemploymentEmployeeRate(type: EmployeeType): number {
  switch (type) {
    case '4a-ucretli':       return 0.01;
    case '4a-emekli':        return 0; // emekli işsizlik ödemez
    case '4b-esnaf':         return 0; // Bağ-Kur
    case '4c-memur':         return 0; // memur
    case '4a-stajyer':       return 0; // stajyer
    case '4a-ev-hizmet-10':  return 0;
    case '4a-ev-hizmet-30':  return 0.01;
  }
}

function getStampTax(gross: number, type: EmployeeType, td: TaxDataYear): number {
  switch (type) {
    case '4a-stajyer':       return 0; // stajyer damga vergisi muaf
    case '4a-ev-hizmet-10':  return gross * td.stampTax; // tam damga vergisi
    default: {
      // Asgari ücret istisnası: brüt asgari ücret kadar damga vergisinden muaf
      if (td.minimumWageExemption) {
        if (gross <= td.minWageBrut) return 0;
        return (gross - td.minWageBrut) * td.stampTax;
      }
      return gross * td.stampTax;
    }
  }
}

// ── Yıllık Tablo Hesaplama (12 Ay) ────────────────────────────────

export interface MonthlyRow {
  month: number;          // 1-12
  monthName: string;
  gross: number;
  net: number;
  incomeTax: number;      // Aylık gelir vergisi (istisna düşülmüş)
  sgkEmployee: number;
  unemployment: number;
  stampTax: number;
  sgkEmployer: number;
  unemploymentEmployer: number;
  totalEmployerCost: number;
  cumulativeMatrah: number;
}

export interface YearlyTableResult {
  rows: MonthlyRow[];
  totals: Omit<MonthlyRow, 'month' | 'monthName' | 'cumulativeMatrah'>;
  averageNet: number;
  totalTax: number;        // Yıllık toplam gelir vergisi
  deductionRate: number;   // Ortalama kesinti oranı
}

const MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export function calculateYearlyTable(
  baseForm: Omit<MaasFormData, 'month' | 'cumulativeMatrah'>,
  monthlyAmounts: number[], // 12 eleman, her ay için brüt veya net maaş (direction'a göre)
): YearlyTableResult {
  const td = getTaxData(baseForm.year);
  const rows: MonthlyRow[] = [];
  let cumulativeMatrah = 0;
  let minWageCumulative = 0;
  const isNetToGross = baseForm.direction === 'netten-brute';

  for (let m = 0; m < 12; m++) {
    const inputAmount = monthlyAmounts[m] ?? 0;
    if (inputAmount <= 0) {
      rows.push({
        month: m + 1,
        monthName: MONTH_NAMES[m],
        gross: 0, net: 0, incomeTax: 0, sgkEmployee: 0,
        unemployment: 0, stampTax: 0, sgkEmployer: 0,
        unemploymentEmployer: 0, totalEmployerCost: 0,
        cumulativeMatrah,
      });
      continue;
    }

    // Netten brüte ise önce brütü bul
    let gross: number;
    if (isNetToGross) {
      const netForm: MaasFormData = {
        ...baseForm,
        month: m + 1,
        cumulativeMatrah,
        minWageCumulativeMatrah: minWageCumulative,
        amount: inputAmount,
        direction: 'netten-brute',
      };
      const ntbResult = nettenBrute(netForm);
      gross = ntbResult.gross;
    } else {
      gross = inputAmount;
    }

    const form: MaasFormData = {
      ...baseForm,
      month: m + 1,
      cumulativeMatrah,
      minWageCumulativeMatrah: minWageCumulative,
      amount: gross,
      direction: 'brutten-nete',
    };

    const result = bruttenNete(form);

    // SGK & işveren detaylarını hesapla
    const ceiling = round2(td.minWageBrut * td.sgkCeilingMultiplier);
    const sgkBase = Math.min(gross, ceiling);
    const sgkEmp = round2(sgkBase * getSgkEmployeeRate(baseForm.employeeType));
    const unemp = round2(sgkBase * getUnemploymentEmployeeRate(baseForm.employeeType));
    const stamp = round2(getStampTax(gross, baseForm.employeeType, td));
    const sgkEmployer = round2(sgkBase * td.sgkEmployer);
    const unempEmployer = round2(sgkBase * td.unemploymentEmployer);
    const totalEmployerCost = round2(gross + sgkEmployer + unempEmployer);

    // Gelir vergisi = toplam kesinti - SGK - işsizlik - damga
    const incomeTax = result.totalDeduction - sgkEmp - unemp - stamp;

    cumulativeMatrah = result.cumulativeMatrah;
    minWageCumulative = result.minWageCumulativeMatrah;

    rows.push({
      month: m + 1,
      monthName: MONTH_NAMES[m],
      gross,
      net: result.net,
      incomeTax: Math.max(0, incomeTax),
      sgkEmployee: sgkEmp,
      unemployment: unemp,
      stampTax: stamp,
      sgkEmployer,
      unemploymentEmployer: unempEmployer,
      totalEmployerCost,
      cumulativeMatrah,
    });
  }

  const activeRows = rows.filter((r) => r.gross > 0);
  const sum = (fn: (r: MonthlyRow) => number) => round2(rows.reduce((s, r) => s + fn(r), 0));

  const totals = {
    gross: sum((r) => r.gross),
    net: sum((r) => r.net),
    incomeTax: sum((r) => r.incomeTax),
    sgkEmployee: sum((r) => r.sgkEmployee),
    unemployment: sum((r) => r.unemployment),
    stampTax: sum((r) => r.stampTax),
    sgkEmployer: sum((r) => r.sgkEmployer),
    unemploymentEmployer: sum((r) => r.unemploymentEmployer),
    totalEmployerCost: sum((r) => r.totalEmployerCost),
  };

  const averageNet = activeRows.length > 0 ? totals.net / activeRows.length : 0;
  const deductionRate = totals.gross > 0 ? (totals.gross - totals.net) / totals.gross : 0;

  return { rows, totals, averageNet, totalTax: totals.incomeTax, deductionRate };
}

// getSgkEmployeeRate ve getUnemploymentEmployeeRate export (calculateYearlyTable'dan erişim için)
export { getSgkEmployeeRate, getUnemploymentEmployeeRate, getStampTax };

// ── Formatlama (UI için) ─────────────────────────────────────────

export function fmtTL(value: number, fractionDigits = 2): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function fmtPct(value: number, fractionDigits = 2): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'percent',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}
