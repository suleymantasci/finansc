'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { fmtTL, fmtPct } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';
import { ShareButton } from '@/components/shared/ShareButton';
import { MonthYearPicker, type MonthYearValue } from './MonthYearPicker';
import { useLatestInflationPeriod } from './useLatestInflationPeriod';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://api.finanscozum.net';

const schema = z.object({
  amount: z.coerce.number().min(0.01, 'Tutar giriniz'),
  baseYear: z.coerce.number().int().min(1900).max(2100),
  baseMonth: z.coerce.number().int().min(1).max(12),
  targetYear: z.coerce.number().int().min(1900).max(2100),
  targetMonth: z.coerce.number().int().min(1).max(12),
});
type FormData = z.infer<typeof schema>;

interface CalcResult {
  base: { period: string; value: number };
  target: { period: string; value: number };
  input: { amount: number };
  result: { value: number; change: number; changePercent: number };
  duration: { years: number; months: number };
}

function defaultRange(
  latest?: { year: number; month: number },
): { base: MonthYearValue; target: MonthYearValue } {
  const target = latest ?? {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  };
  const base = { ...target };
  if (base.month === 1) {
    base.year -= 1;
    base.month = 12;
  } else {
    base.month -= 1;
  }
  // Eğer base, latest'ten sonraki bir dönem olduysa (latest takvimden gerideyse)
  // 1 yıl önceye fallback et.
  if (base.year > target.year || (base.year === target.year && base.month > target.month)) {
    base.year = target.year - 1;
    base.month = target.month;
  }
  return { base, target };
}

function readFormFromUrl(
  latest?: { year: number; month: number },
): FormData {
  const r = defaultRange(latest);
  const defaults: FormData = {
    amount: 0,
    baseYear: r.base.year,
    baseMonth: r.base.month,
    targetYear: r.target.year,
    targetMonth: r.target.month,
  };
  if (typeof window === 'undefined') return defaults;
  const sp = new URLSearchParams(window.location.search);
  const num = (k: keyof FormData, fallback: number): number => {
    const v = sp.get(k as string);
    if (v === null || v === '') return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };
  return {
    amount: num('amount', defaults.amount),
    baseYear: num('baseYear', defaults.baseYear),
    baseMonth: num('baseMonth', defaults.baseMonth),
    targetYear: num('targetYear', defaults.targetYear),
    targetMonth: num('targetMonth', defaults.targetMonth),
  };
}

function writeFormToUrl(form: FormData) {
  if (typeof window === 'undefined') return;
  const sp = new URLSearchParams(window.location.search);
  for (const [k, v] of Object.entries(form)) {
    if (v === 0) sp.delete(k);
    else sp.set(k, String(v));
  }
  const qs = sp.toString();
  window.history.replaceState(
    null,
    '',
    qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
  );
}

export function ParasalDeger() {
  const latest = useLatestInflationPeriod();
  const initialForm = latest ? readFormFromUrl(latest) : null;
  const [result, setResult] = useState<CalcResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: initialForm ?? undefined,
    });

  // latest hook fetch tamamlanınca form default'larını güncelle
  // (initial mount'ta latest=null olduğu için).
  // initialForm her render'da yeni obje (readFormFromUrl window.location.search okur),
  // ama reset tetikleyebilmek için latest.year/month yeterli — URL değişikliği zaten
  // writeFormToUrl → re-render → latest değişmediği için tek seferlik problem olabilir.
  useEffect(() => {
    if (initialForm) reset(initialForm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest?.year, latest?.month, typeof window !== 'undefined' ? window.location.search : '']);

  const base: MonthYearValue = initialForm
    ? { year: watch('baseYear'), month: watch('baseMonth') }
    : { year: 0, month: 0 };
  const target: MonthYearValue = initialForm
    ? { year: watch('targetYear'), month: watch('targetMonth') }
    : { year: 0, month: 0 };

  const onSubmit = async (data: FormData) => {
    setError(null);
    setLoading(true);
    writeFormToUrl(data);
    try {
      const res = await fetch(`${API_URL}/api/inflation/tufe/endeks/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseYear: data.baseYear,
          baseMonth: data.baseMonth,
          targetYear: data.targetYear,
          targetMonth: data.targetMonth,
          amount: data.amount,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(
          body?.error ||
            `TÜFE endeks verisi şu an alınamıyor (HTTP ${res.status}). api.tasci.cloud/status sayfasını kontrol edin.`,
        );
        setResult(null);
        return;
      }
      const body = (await res.json()) as CalcResult;
      setResult(body);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Bilinmeyen bir ağ hatası oluştu.',
      );
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    reset();
    setResult(null);
    setError(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}${window.location.search}`
      : '';

  return (
    <>
      {!initialForm && (
        <p className="text-sm text-muted-foreground mb-4">Yükleniyor…</p>
      )}
      {initialForm && (
      <>
      <p className="text-sm text-muted-foreground mb-4">
        Bir tutarın TÜFE endeksine göre güncellenmiş değerini hesaplayın.
        Başlangıç ve hedef dönemi seçin, biz otomatik hesaplayalım.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Para Tutarı (₺)"
          type="number"
          step="0.01"
          placeholder="Örn. 10000"
          {...register('amount')}
          error={errors.amount?.message}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MonthYearPicker
            label="Başlangıç Dönemi"
            value={base}
            onChange={(v) => {
              setValue('baseYear', v.year);
              setValue('baseMonth', v.month);
            }}
            maxYear={latest?.year}
            maxMonth={latest?.month}
          />
          <MonthYearPicker
            label="Hedef Dönem"
            value={target}
            onChange={(v) => {
              setValue('targetYear', v.year);
              setValue('targetMonth', v.month);
            }}
            maxYear={latest?.year}
            maxMonth={latest?.month}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Kaynak: TÜFE 2003=100 bazlı endeks (TCMB, tasci-api üzerinden).
        </p>
        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? 'Hesaplanıyor…' : 'Hesapla'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={loading}
          >
            Sıfırla
          </Button>
        </div>
      </form>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {result && (
        <>
          <div className="flex items-center justify-between gap-2 mt-6 flex-wrap">
            <p className="text-sm text-muted-foreground">
              Sonucu paylaş — link'i kopyalayıp gönderebilirsiniz.
            </p>
            <ShareButton shareUrl={shareUrl} />
          </div>
          <ResultCard>
            <ResultRow label="Başlangıç Endeksi" value={result.base.value.toFixed(2)} />
            <ResultRow label="Hedef Endeks" value={result.target.value.toFixed(2)} />
            <ResultRow label="Güncellenmiş Değer" value={fmtTL(result.result.value)} highlight />
            <ResultRow label="Değişim (₺)" value={fmtTL(result.result.change)} />
            <ResultRow label="Değişim Oranı" value={fmtPct(result.result.changePercent)} />
          </ResultCard>
        </>
      )}

      <ToolInfo
        title="Parasal Değer Nedir?"
        description="Parasal değer hesaplama, bir tutarın belirli dönemler arasındaki enflasyona göre güncellenmiş değerini bulmak için kullanılır. TCMB tarafından açıklanan TÜFE 2003=100 bazlı endeks verileri kullanılarak hesaplanır."
        faqs={[
          { q: 'TÜFE nedir?', a: 'Tüketici Fiyat Endeksi, her ay TÜİK tarafından açıklanan fiyat değişim göstergesidir.' },
          { q: 'Endeks ne anlama gelir?', a: '2003 yılı 100 kabul edilir; endeks 250 ise o tarihteki mal sepeti 2003 fiyatının 2,5 katına çıkmış demektir.' },
        ]}
      />
      </>
      )}
    </>
  );
}