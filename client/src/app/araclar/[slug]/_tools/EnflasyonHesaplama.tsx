'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { fmtTL, fmtPct } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';
import { ShareButton } from '@/components/shared/ShareButton';
import { MonthYearPicker, type MonthYearValue } from './MonthYearPicker';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://api.finanscozum.net';

const schema = z.object({
  amount: z.coerce.number().min(0.01, 'Tutar giriniz'),
  baseYear: z.coerce.number().int().min(2003).max(2100),
  baseMonth: z.coerce.number().int().min(1).max(12),
  targetYear: z.coerce.number().int().min(2003).max(2100),
  targetMonth: z.coerce.number().int().min(1).max(12),
});
type FormData = z.infer<typeof schema>;

interface CalcResult {
  base: { period: string; value: number };
  target: { period: string; value: number };
  result: { value: number; change: number; changePercent: number };
}

function defaultRange(): { base: MonthYearValue; target: MonthYearValue } {
  const now = new Date();
  const targetYear = now.getFullYear();
  const targetMonth = now.getMonth() + 1;
  const base = new Date(now);
  base.setFullYear(base.getFullYear() - 1);
  return {
    base: { year: base.getFullYear(), month: targetMonth },
    target: { year: targetYear, month: targetMonth },
  };
}

function readFormFromUrl(): FormData {
  const r = defaultRange();
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

export function EnflasyonHesaplama() {
  const initialForm = readFormFromUrl();
  const [result, setResult] = useState<CalcResult | null>(null);
  const [inflationRate, setInflationRate] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: initialForm,
    });

  const base: MonthYearValue = {
    year: watch('baseYear'),
    month: watch('baseMonth'),
  };
  const target: MonthYearValue = {
    year: watch('targetYear'),
    month: watch('targetMonth'),
  };

  const onSubmit = async (data: FormData) => {
    setError(null);
    setLoading(true);
    writeFormToUrl(data);
    try {
      // TÜFE değişim oranını bulmak için amount=100 ile calculate çağır.
      const res = await fetch(`${API_URL}/api/inflation/tufe/endeks/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseYear: data.baseYear,
          baseMonth: data.baseMonth,
          targetYear: data.targetYear,
          targetMonth: data.targetMonth,
          amount: 100,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(
          body?.error ||
            `TÜFE endeks verisi şu an alınamıyor (HTTP ${res.status}). api.tasci.cloud/status sayfasını kontrol edin.`,
        );
        setResult(null);
        setInflationRate(null);
        return;
      }
      const body = (await res.json()) as CalcResult;
      const rate = body.result.changePercent;
      setInflationRate(rate);
      // Sonra kullanıcının tutarı için yerel hesap: newValue = amount * (1 + rate/100)
      const userRate = rate / 100;
      const newValue = data.amount * (1 + userRate);
      setResult({
        base: body.base,
        target: body.target,
        result: {
          value: newValue,
          change: newValue - data.amount,
          changePercent: rate,
        },
      });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Bilinmeyen bir ağ hatası oluştu.',
      );
      setResult(null);
      setInflationRate(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    reset();
    setResult(null);
    setError(null);
    setInflationRate(null);
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
      <p className="text-sm text-muted-foreground mb-4">
        TÜFE endeksine göre seçtiğiniz iki dönem arasındaki enflasyon oranını ve
        mal sepetininizin yeni değerini hesaplayın.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Mal Sepeti / Tutar (₺)"
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
          />
          <MonthYearPicker
            label="Hedef Dönem"
            value={target}
            onChange={(v) => {
              setValue('targetYear', v.year);
              setValue('targetMonth', v.month);
            }}
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

      {result && inflationRate !== null && (
        <>
          <div className="flex items-center justify-between gap-2 mt-6 flex-wrap">
            <p className="text-sm text-muted-foreground">
              Sonucu paylaş — link'i kopyalayıp gönderebilirsiniz.
            </p>
            <ShareButton shareUrl={shareUrl} />
          </div>
          <ResultCard>
            <ResultRow label="Enflasyon Oranı" value={fmtPct(inflationRate)} highlight />
            <ResultRow label="Yeni Değer" value={fmtTL(result.result.value)} />
            <ResultRow label="Fark (₺)" value={fmtTL(result.result.change)} />
            <ResultRow label="Başlangıç Endeksi" value={result.base.value.toFixed(2)} />
            <ResultRow label="Hedef Endeks" value={result.target.value.toFixed(2)} />
          </ResultCard>
        </>
      )}

      <ToolInfo
        title="Enflasyon Hesaplama Nedir?"
        description="Enflasyon hesaplama aracı, belirli bir tutarın seçilen iki dönem arasındaki TÜFE endeks değişimine göre yeni değerini hesaplar. TCMB tarafından açıklanan TÜFE 2003=100 bazlı endeks kullanılır."
        faqs={[
          { q: 'TÜFE nedir?', a: 'Tüketici Fiyat Endeksi\'nin kısaltmasıdır. Her ay TÜİK tarafından açıklanan fiyat artış oranıdır.' },
          { q: 'Enflasyon neden önemlidir?', a: 'Paranın satın alma gücünü doğrudan etkiler. Yüksek enflasyon dönemlerinde aynı para ile daha az ürün/hizmet alınabilir.' },
        ]}
      />
    </>
  );
}