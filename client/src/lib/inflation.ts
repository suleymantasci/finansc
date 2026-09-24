import { API_URL } from '@/lib/constants';
// Server-side fetch helpers for TCMB inflation data (upstream TÜFE/ÜFE servisi).
// ISR: 1 hour revalidate — data updates monthly, this is more than enough.

export const INFLATION_REVALIDATE_SECONDS = 600;

export interface TufeEntry {
  period: string; // "05-2026"
  yearlyChange: number | null;
  monthlyChange: number | null;
}

export interface UfeEntry {
  period: string;
  ufeYearlyChange: number | null;
  yiUfeYearlyChange: number | null;
  ufeMonthlyChange: number | null;
  yiUfeMonthlyChange: number | null;
}

interface TufeLatestResponse {
  success: boolean;
  latest?: TufeEntry;
  previous?: TufeEntry;
  scrapedAt?: string;
}

interface UfeLatestResponse {
  success: boolean;
  latest?: UfeEntry;
  previous?: UfeEntry;
  scrapedAt?: string;
}

interface TufeListResponse {
  success: boolean;
  count?: number;
  history?: TufeEntry[];
  scrapedAt?: string;
}

interface UfeListResponse {
  success: boolean;
  count?: number;
  history?: UfeEntry[];
  scrapedAt?: string;
}

function getApiUrl(): string {
  // Build-time'da NEXT_PUBLIC_API_URL bake olur (client/Dockerfile ARG).
  // Server-side fetch'te absolute URL gerekli (rewrite sadece client isteklerinde çalışır).
  // Eğer env set değilse API_URL fallback'i kullan (lib/constants.ts).
  return API_URL;
}

async function safeJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function apiFetch<T>(path: string): Promise<T | null> {
  const url = `${getApiUrl()}${path}`;
  try {
    const res = await fetch(url, {
      next: { revalidate: INFLATION_REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    return await safeJson<T>(res);
  } catch {
    return null;
  }
}

export async function fetchTufeLatest(): Promise<TufeLatestResponse | null> {
  return apiFetch<TufeLatestResponse>('/api/inflation/tufe/latest');
}

export async function fetchUfeLatest(): Promise<UfeLatestResponse | null> {
  return apiFetch<UfeLatestResponse>('/api/inflation/ufe/latest');
}

export async function fetchTufeAll(): Promise<TufeListResponse | null> {
  return apiFetch<TufeListResponse>('/api/inflation/tufe');
}

export async function fetchUfeAll(): Promise<UfeListResponse | null> {
  return apiFetch<UfeListResponse>('/api/inflation/ufe');
}

// ── Formatting helpers (Turkish locale, used in many places) ─────────────

const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export function formatPeriodTr(period: string): string {
  // "05-2026" → "Mayıs 2026"
  const m = period.match(/^(\d{2})-(\d{4})$/);
  if (!m) return period;
  const monthIdx = parseInt(m[1], 10) - 1;
  if (monthIdx < 0 || monthIdx > 11) return period;
  return `${MONTHS_TR[monthIdx]} ${m[2]}`;
}

export function formatPercentTr(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined) return '—';
  // Türkçe ondalık ayırıcı: %31,51 (nokta değil)
  return `%${value.toLocaleString('tr-TR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

export function formatChange(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}