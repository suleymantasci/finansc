'use client';

import { useEffect, useRef, useState } from 'react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://api.finanscozum.net';

export interface InflationPeriod {
  year: number;
  month: number; // 1-12
}

/**
 * Tasci-api'nin şu anki TÜFE serisinin son dönemini çeker.
 * MonthYearPicker'ı maxYear/maxMonth olarak sınırlamak için kullanılır
 * (örn. tasci-api henüz Haziran 2026'yı yayınlamadıysa Temmuz seçtirmemeli).
 *
 * Fallback: fetch başarısız olursa şu anki takvim ayını kullanır.
 */
export function useLatestInflationPeriod(): InflationPeriod | null {
  const [period, setPeriod] = useState<InflationPeriod | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    fetch(`${API_URL}/api/inflation/tufe/endeks/latest`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (cancelledRef.current || !body?.period) return;
        const m = String(body.period).match(/^(\d{4})-(\d{2})$/);
        if (!m) return;
        setPeriod({ year: Number(m[1]), month: Number(m[2]) });
      })
      .catch(() => {
        if (cancelledRef.current) return;
        const now = new Date();
        setPeriod({ year: now.getFullYear(), month: now.getMonth() + 1 });
      });
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  return period;
}