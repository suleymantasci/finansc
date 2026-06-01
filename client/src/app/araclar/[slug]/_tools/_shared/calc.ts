/** Annuity monthly payment: P * r * (1+r)^n / ((1+r)^n - 1) */
export function annuityPayment(principal: number, monthlyRate: number, months: number): number {
  if (monthlyRate === 0) return principal / months;
  const r = monthlyRate;
  const pow = Math.pow(1 + r, months);
  return (principal * r * pow) / (pow - 1);
}

/** Build amortization schedule */
export interface AmortRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  bsmv: number;
  kkdf: number;
  totalPayment: number;
}

export function amortizationSchedule(
  loanAmount: number,
  monthlyRatePercent: number,
  months: number,
  bsmvRate = 0.15,
  kkdfRate = 0.15,
): AmortRow[] {
  const baseRate = monthlyRatePercent / 100;
  const effectiveRate = baseRate * (1 + bsmvRate + kkdfRate);
  const monthly = annuityPayment(loanAmount, effectiveRate, months);
  const rows: AmortRow[] = [];
  let balance = loanAmount;

  for (let i = 1; i <= months; i++) {
    const interest = balance * baseRate;
    const bsmv = interest * bsmvRate;
    const kkdf = interest * kkdfRate;
    const principalPart = monthly - interest - bsmv - kkdf;
    balance -= principalPart;
    rows.push({
      month: i,
      payment: monthly,
      principal: principalPart,
      interest,
      balance: Math.max(0, balance),
      bsmv,
      kkdf,
      totalPayment: monthly,
    });
  }
  return rows;
}

/** Remaining principal after n payments */
export function remainingPrincipal(
  loanAmount: number,
  monthlyRatePercent: number,
  totalMonths: number,
  paidMonths: number,
  bsmvRate = 0.15,
  kkdfRate = 0.15,
): number {
  const baseRate = monthlyRatePercent / 100;
  const effectiveRate = baseRate * (1 + bsmvRate + kkdfRate);
  const monthly = annuityPayment(loanAmount, effectiveRate, totalMonths);
  let balance = loanAmount;
  for (let i = 0; i < paidMonths; i++) {
    const interest = balance * baseRate;
    const bsmv = interest * bsmvRate;
    const kkdf = interest * kkdfRate;
    balance -= (monthly - interest - bsmv - kkdf);
  }
  return Math.max(0, balance);
}

/** Simple interest: P * r/365 * days */
export function simpleInterest(principal: number, yearlyRatePercent: number, days: number): number {
  return (principal / 100) * (yearlyRatePercent / 365) * days;
}

/** Compound interest: P * (1 + r)^n */
export function compoundFV(principal: number, ratePerPeriod: number, periods: number): number {
  return principal * Math.pow(1 + ratePerPeriod, periods);
}

/** NPV */
export function npv(discountRate: number, cashFlows: number[]): number {
  return cashFlows.reduce((acc, cf, i) => acc + cf / Math.pow(1 + discountRate, i + 1), 0);
}

/** IRR using Newton-Raphson */
export function irr(cashFlows: number[], initialInvestment: number, guess = 0.1, maxIter = 1000): number | null {
  let rate = guess;
  for (let i = 0; i < maxIter; i++) {
    let fVal = -initialInvestment;
    let fPrime = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      const disc = Math.pow(1 + rate, t + 1);
      fVal += cashFlows[t] / disc;
      fPrime -= (t + 1) * cashFlows[t] / Math.pow(1 + rate, t + 2);
    }
    if (Math.abs(fPrime) < 1e-12) return null;
    const newRate = rate - fVal / fPrime;
    if (Math.abs(newRate - rate) < 1e-10) return newRate;
    rate = newRate;
  }
  return rate;
}

/** IBAN validation (mod 97) */
export function validateIBAN(iban: string): { valid: boolean; country: string; bankCode: string } {
  const cleaned = iban.replace(/\s+/g, '').toUpperCase();
  const country = cleaned.substring(0, 2);
  const bankCode = cleaned.length >= 8 ? cleaned.substring(4, 8) : '';

  if (cleaned.length < 15 || cleaned.length > 34) {
    return { valid: false, country, bankCode };
  }
  if (!/^[A-Z]{2}\d{2}/.test(cleaned)) {
    return { valid: false, country, bankCode };
  }

  // Move first 4 chars to end
  const rearranged = cleaned.substring(4) + cleaned.substring(0, 4);
  // Convert letters to numbers (A=10, B=11, ...)
  let numStr = '';
  for (const ch of rearranged) {
    if (ch >= 'A' && ch <= 'Z') {
      numStr += (ch.charCodeAt(0) - 55).toString();
    } else {
      numStr += ch;
    }
  }
  // Mod 97 using chunking (BigInt alternative for large numbers)
  let remainder = 0;
  for (let i = 0; i < numStr.length; i++) {
    remainder = (remainder * 10 + parseInt(numStr[i], 10)) % 97;
  }
  return { valid: remainder === 1, country, bankCode };
}

/** Format TL */
export function fmtTL(n: number): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(n);
}

/** Format percent */
export function fmtPct(n: number): string {
  return `%${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)}`;
}

/** Format number */
export function fmtNum(n: number, decimals = 2): string {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);
}
