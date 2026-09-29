// Hesaplama araçlarının ortak, saf (yan etkisiz) yardımcıları.
// Bu klasördeki modüller node:test ile doğrudan test edilir; göreli importlar
// bu yüzden '.ts' uzantısıyla yazılır.

import type { Bracket } from './params.ts';

/**
 * Ondalık basamağa yuvarlar (yarım yukarı, negatiflerde simetrik). Çarpımı 15 anlamlı
 * basamağa indirerek kayan nokta artığını temizler: 33030 × 0,1675 = 5532,525 → 5532,53
 * (düz Math.round 5532,52 verir; SGK tabloları 5532,53 yazar).
 */
export function roundTo(n: number, decimals: number): number {
  if (!Number.isFinite(n)) return n;
  const f = 10 ** decimals;
  const scaled = Number((Math.abs(n) * f).toPrecision(15));
  const s = n < 0 ? -1 : 1;
  return (s * Math.round(scaled)) / f;
}

/** Kuruşa yuvarlar. */
export function round2(n: number): number {
  return roundTo(n, 2);
}

/**
 * Kullanıcının yazdığı sayıyı çözer. Türkçe biçimi (1.234.567,89) ve düz biçimi (1234567.89)
 * kabul eder. Tek nokta ve ardından tam 3 rakam binlik ayırıcı sayılır ("100.000" → 100000);
 * aksi halde ondalık ("3.5" → 3,5). Boş/geçersiz girişte NaN döner.
 */
export function parseTrNumber(input: string | number | null | undefined): number {
  if (typeof input === 'number') return input;
  if (input == null) return NaN;
  let s = String(input).trim().replace(/\s|₺|TL|%/gi, '');
  if (s === '' || s === '-' || s === ',' || s === '.') return NaN;
  const neg = s.startsWith('-');
  if (neg) s = s.slice(1);
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
    if (s.includes(',')) return NaN;
  } else {
    const dots = (s.match(/\./g) || []).length;
    if (dots > 1) s = s.replace(/\./g, '');
    else if (dots === 1 && /^\d{1,3}\.\d{3}$/.test(s)) s = s.replace('.', '');
  }
  if (!/^\d*\.?\d*$/.test(s)) return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? (neg ? -n : n) : NaN;
}

// ── Tarih (saat dilimi bağımsız; 'YYYY-MM-DD') ─────────────────────────

const DAY_MS = 86400000;

export function isIsoDate(s: unknown): s is string {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** 1970-01-01'den bu yana gün sayısı */
export function dayNumber(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

export function fromDayNumber(n: number): string {
  return new Date(n * DAY_MS).toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  return fromDayNumber(dayNumber(iso) + days);
}

function daysInMonth(y: number, m1: number): number {
  return new Date(Date.UTC(y, m1, 0)).getUTCDate();
}

/** Ay ekler; hedef ayda gün yoksa ayın son gününe çeker (31 Ocak + 1 ay = 28/29 Şubat). */
export function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const nd = Math.min(d, daysInMonth(ny, nm));
  return `${ny}-${String(nm).padStart(2, '0')}-${String(nd).padStart(2, '0')}`;
}

export function addYears(iso: string, years: number): string {
  return addMonths(iso, years * 12);
}

/** İki tarih arasındaki gün farkı (b − a). */
export function daysBetween(a: string, b: string): number {
  return dayNumber(b) - dayNumber(a);
}

/** 0 = Pazar … 6 = Cumartesi */
export function weekday(iso: string): number {
  return (dayNumber(iso) + 4) % 7; // 1970-01-01 Perşembe
}

export interface Ymd { years: number; months: number; days: number }

/**
 * Takvim farkı: a'dan b'ye kaç tam yıl, ay ve gün var (a ≤ b). Java Period.between ile
 * aynı kural: gün eksiye düşerse bir ay geri alınır, kalan gün a + (ay) tarihinden sayılır
 * (ay sonu kırpılır). 31 Ocak → 28 Şubat = 28 gün; 31 Ocak → 1 Mart = 1 ay 1 gün;
 * 15 Mart 2000 → 14 Mart 2026 = 25 yıl 11 ay 27 gün.
 */
export function diffYmd(a: string, b: string): Ymd {
  if (a > b) return diffYmd(b, a);
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  let totalMonths = (by * 12 + bm) - (ay * 12 + am);
  let days = bd - ad;
  if (totalMonths > 0 && days < 0) {
    totalMonths -= 1;
    days = daysBetween(addMonths(a, totalMonths), b);
  }
  return { years: Math.floor(totalMonths / 12), months: totalMonths % 12, days };
}

export const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
export const TR_WEEKDAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

/** '2026-09-28' → '28 Eylül 2026' */
export function fmtDateTr(iso: string, withWeekday = false): string {
  const [y, m, d] = iso.split('-').map(Number);
  const base = `${d} ${TR_MONTHS[m - 1]} ${y}`;
  return withWeekday ? `${base} ${TR_WEEKDAYS[weekday(iso)]}` : base;
}

export function fmtYmd(v: Ymd): string {
  const parts: string[] = [];
  if (v.years) parts.push(`${v.years} yıl`);
  if (v.months) parts.push(`${v.months} ay`);
  if (v.days || parts.length === 0) parts.push(`${v.days} gün`);
  return parts.join(' ');
}

// ── Vergi dilimi ────────────────────────────────────────────────────────

/** Artan oranlı tarifeye göre toplam vergi. */
export function bracketTax(matrah: number, brackets: Bracket[]): number {
  if (!(matrah > 0)) return 0;
  let tax = 0;
  for (let i = 0; i < brackets.length; i++) {
    const lo = brackets[i].limit;
    const hi = i + 1 < brackets.length ? brackets[i + 1].limit : Infinity;
    if (matrah <= lo) break;
    tax += (Math.min(matrah, hi) - lo) * brackets[i].rate;
  }
  return tax;
}

/** Kümülatif matrahı `prev` olan kişiye `add` kadar ek matrahın vergisi. */
export function incrementalTax(prev: number, add: number, brackets: Bracket[]): number {
  return bracketTax(prev + add, brackets) - bracketTax(prev, brackets);
}

/** Matrahın düştüğü en yüksek dilimin oranı. */
export function marginalRate(matrah: number, brackets: Bracket[]): number {
  let rate = brackets[0].rate;
  for (const b of brackets) if (matrah > b.limit) rate = b.rate;
  return rate;
}

// ── Faiz / anüite ───────────────────────────────────────────────────────

/** Eşit taksit: P·r·(1+r)^n / ((1+r)^n − 1) */
export function annuity(principal: number, rate: number, n: number): number {
  if (n <= 0) return NaN;
  if (rate === 0) return principal / n;
  const p = (1 + rate) ** n;
  return (principal * rate * p) / (p - 1);
}

/** Taksitlerin bugünkü değeri */
export function presentValueOfAnnuity(payment: number, rate: number, n: number): number {
  if (rate === 0) return payment * n;
  return (payment * (1 - (1 + rate) ** -n)) / rate;
}

/**
 * Monoton f için f(x) = target denklemini [lo, hi] aralığında ikiye bölme ile çözer.
 * Kök aralıkta yoksa NaN.
 */
export function solveMonotone(f: (x: number) => number, target: number, lo: number, hi: number, iter = 200): number {
  let flo = f(lo) - target;
  const fhi = f(hi) - target;
  if (Number.isNaN(flo) || Number.isNaN(fhi) || flo * fhi > 0) return NaN;
  for (let i = 0; i < iter; i++) {
    const mid = (lo + hi) / 2;
    const fm = f(mid) - target;
    if (Math.abs(fm) < 1e-12 || (hi - lo) / 2 < 1e-15) return mid;
    if (fm * flo < 0) hi = mid;
    else {
      lo = mid;
      flo = fm;
    }
  }
  return (lo + hi) / 2;
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}
