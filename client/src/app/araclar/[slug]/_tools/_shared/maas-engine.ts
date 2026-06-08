// ── Maaş Hesaplama Motoru (Brütten Nete / Netten Brüte) ────────────
//
// Türkiye'de ücretli çalışanlar (4/a) için standart hesaplama akışı:
//   1) Brüt maaş
//   2) SGK primi (işçi %14) + İşsizlik sigortası (işçi %1) kesilir
//   3) Kalan tutar = Gelir vergisi matrahı
//   4) Kümülatif matrah dikkate alınarak gelir vergisi dilimleri uygulanır
//   5) Asgari ücret istisnası (varsa) gelir vergisinden düşülür
//   6) Damga vergisi (binde 7.59) brüt üzerinden hesaplanır
//   7) AGİ (Asgari Geçim İndirimi) hesaplanan gelir vergisinden düşülür
//   8) Net maaş = Brüt - (SGK + İşsizlik + Gelir Vergisi + Damga - AGİ)
//   9) İşveren maliyeti = Brüt + SGK işveren + İşsizlik işveren
//
// Stajyer/Çırak: SGK %7, gelir vergisi muaf, damga vergisi muaf
// Ev Hizmetleri 10 gün: SGK muaf, gelir vergisi var
// Ev Hizmetleri 30 gün: 4/a normal (ilk 10 gün muaf sonra tam)
// Emekli: SGK kesilir (işveren kısmi), gelir vergisi var
// Bağ-Kur/Memur: ayrı modeller (basitleştirilmiş)

import {
  getTaxData,
  getAgiMonthly,
  type MaasFormData,
  type TaxDataYear,
  type EmployeeType,
} from './tax-data';

// ── Tipler ─────────────────────────────────────────────────────────

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
  agiMonthly: number;          // Uygulanan AGİ (aylık)
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
  const ceiling = td.minWageBrut * td.sgkCeilingMultiplier;
  const sgkBase = Math.min(gross, ceiling);

  // ── 1) SGK primi (işçi) ──
  const sgkEmployeeRate = getSgkEmployeeRate(form.employeeType);
  const sgkEmployee = sgkBase * sgkEmployeeRate;
  lines.push({
    label: 'SGK Primi (işçi)',
    amount: sgkEmployee,
    rate: sgkEmployeeRate,
    kind: 'deduction',
  });

  // ── 2) İşsizlik sigortası (işçi) ──
  const unemploymentRate = getUnemploymentEmployeeRate(form.employeeType);
  const unemployment = sgkBase * unemploymentRate;
  if (unemployment > 0) {
    lines.push({
      label: 'İşsizlik Sigortası (işçi)',
      amount: unemployment,
      rate: unemploymentRate,
      kind: 'deduction',
    });
  }

  // ── 3) Gelir vergisi matrahı ──
  const matrah = gross - sgkEmployee - unemployment;
  lines.push({
    label: 'Gelir Vergisi Matrahı',
    amount: matrah,
    kind: 'info',
  });

  // ── 4) Gelir vergisi (kümülatif matrah dahil) ──
  const incomeTax = calculateIncomeTax(matrah, form.cumulativeMatrah, td);
  lines.push({
    label: 'Hesaplanan Gelir Vergisi',
    amount: incomeTax,
    kind: 'deduction',
  });

  // ── 5) Asgari ücret istisnası ──
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
    // Brüt asgari ücret kadar kısmi istisna
    const minWageMatrah = td.minWageBrut - (td.minWageBrut * (sgkEmployeeRate + unemploymentRate));
    const minWageCumulative = form.cumulativeMatrah;
    const minWageTax = calculateIncomeTax(minWageMatrah, minWageCumulative, td);
    minimumWageExemption = Math.min(minWageTax, incomeTax);
    if (minimumWageExemption > 0) {
      lines.push({
        label: 'Asgari Ücret İstisnası (kısmi)',
        amount: -minimumWageExemption,
        kind: 'info',
      });
    }
  }

  // ── 6) Damga vergisi ──
  const stampTax = getStampTax(gross, form.employeeType, td);
  if (stampTax > 0) {
    lines.push({
      label: 'Damga Vergisi (binde 7.59)',
      amount: stampTax,
      rate: td.stampTax,
      kind: 'deduction',
    });
  }

  // ── 7) AGİ (gelir vergisinden düşüm) ──
  const agiMonthly = getAgiMonthly(form.year, form.maritalStatus, form.childCount);
  // AGİ engellilik indirimi
  const disabilityAnnual = td.disabilityDeduction[form.disability] || 0;
  const disabilityMonthly = disabilityAnnual / 12;
  const agiTotal = agiMonthly + disabilityMonthly;

  // AGİ gelir vergisini aşamaz (aşan kısmı ödenmez)
  const agiApplied = Math.min(agiTotal, incomeTax - minimumWageExemption);
  if (agiTotal > 0) {
    lines.push({
      label: `AGİ (${form.maritalStatus === 'bekar' ? 'Bekâr' : 'Evli'}, ${form.childCount} çocuk${form.disability !== 'yok' ? `, ${form.disability} derece engelli` : ''})`,
      amount: -agiApplied,
      kind: 'info',
    });
  }

  // ── 8) Net maaş ──
  const incomeTaxAfter = incomeTax - minimumWageExemption - agiApplied;
  const totalDeduction = sgkEmployee + unemployment + incomeTaxAfter + stampTax;
  const net = gross - totalDeduction;

  lines.push({
    label: 'NET MAAŞ',
    amount: net,
    kind: 'income',
    highlight: true,
  });

  // ── 9) İşveren maliyeti (opsiyonel) ──
  let totalEmployerCost = gross;
  if (form.showEmployerCost) {
    const sgkEmployer = sgkBase * td.sgkEmployer;
    const unemploymentEmployer = sgkBase * td.unemploymentEmployer;
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
    totalEmployerCost = gross + sgkEmployer + unemploymentEmployer;
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
    agiMonthly,
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
      const span = (next ? next.limit : matrah) - cur.limit;
      tax += span * cur.rate;
    } else {
      break;
    }
  }
  return tax;
}

// ── Çalışan Türüne Göre Oran ─────────────────────────────────────

function getSgkEmployeeRate(type: EmployeeType): number {
  const td = getTaxData(2025); // oran yıldan bağımsız, sabit
  switch (type) {
    case '4a-ucretli':       return td.sgkEmployee;
    case '4a-emekli':        return td.sgkEmployee; // yeniden çalışan emekli
    case '4b-esnaf':         return 0.20; // Bağ-Kur
    case '4c-memur':         return 0.16; // memur
    case '4a-stajyer':       return 0.07; // stajyer SGK
    case '4a-ev-hizmet-10':  return 0; // ilk 10 gün muaf
    case '4a-ev-hizmet-30':  return td.sgkEmployee; // 30 gün üzeri tam
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
    case '4a-ev-hizmet-10':  return gross * td.stampTax; // var
    default:                  return gross * td.stampTax;
  }
}

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
