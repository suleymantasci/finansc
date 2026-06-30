// Server-side fetch helpers for TCMB inflation data (tasci-api).
// ISR: 1 hour revalidate — data updates monthly, this is more than enough.

export const INFLATION_REVALIDATE_SECONDS = 3600;

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
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
}

async function safeJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchTufeLatest(): Promise<TufeLatestResponse | null> {
  try {
    const res = await fetch(`${getApiUrl()}/api/tufe/latest`, {
      next: { revalidate: INFLATION_REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    return await safeJson<TufeLatestResponse>(res);
  } catch {
    return null;
  }
}

export async function fetchUfeLatest(): Promise<UfeLatestResponse | null> {
  try {
    const res = await fetch(`${getApiUrl()}/api/ufe/latest`, {
      next: { revalidate: INFLATION_REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    return await safeJson<UfeLatestResponse>(res);
  } catch {
    return null;
  }
}

export async function fetchTufeAll(): Promise<TufeListResponse | null> {
  try {
    const res = await fetch(`${getApiUrl()}/api/tufe`, {
      next: { revalidate: INFLATION_REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    return await safeJson<TufeListResponse>(res);
  } catch {
    return null;
  }
}

export async function fetchUfeAll(): Promise<UfeListResponse | null> {
  try {
    const res = await fetch(`${getApiUrl()}/api/ufe`, {
      next: { revalidate: INFLATION_REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    return await safeJson<UfeListResponse>(res);
  } catch {
    return null;
  }
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
  return `%${value.toFixed(digits)}`;
}

export function formatChange(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}`;
}