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
  investment: z.coerce.number().min(0.01, 'Yatırım tutarı giriniz'),
  endValue: z.coerce.number().min(0.01, 'Vade sonu tutarı giriniz'),
  baseYear: z.coerce.number().int().min(2003).max(2100),
  baseMonth: z.coerce.number().int().min(1).max(12),
  targetYear: z.coerce.number().int().min(2003).max(2100),
  targetMonth: z.coerce.number().int().min(1).max(12),
});
type FormData = z.infer<typeof schema>;

interface CalcResult {
  nominal: number; // %
  real: number; // %
  nominalReturn: number; // ₺
  realReturn: number; // ₺
  inflationRate: number; // % — otomatik hesaplanan
  base: { period: string; value: number };
  target: { period: string; value: number };
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
    investment: 0,
    endValue: 0,
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
    investment: num('investment', defaults.investment),
    endValue: num('endValue', defaults.endValue),
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

export function ReelGetiri() {
  const initialForm = readFormFromUrl();
  const [result, setResult] = useState<CalcResult | null>(null);
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
      // Enflasyon oranını backend'den çek (amount=100 ile calculate → changePercent).
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
        return;
      }
      const body = await res.json();
      const inflationRate: number = body.result.changePercent;
      // Fisher denklemi (frontend'de):
      const nominal = (data.endValue - data.investment) / data.investment;
      const inflation = inflationRate / 100;
      const real = (1 + nominal) / (1 + inflation) - 1;
      setResult({
        nominal: nominal * 100,
        real: real * 100,
        nominalReturn: data.endValue - data.investment,
        realReturn: data.investment * real,
        inflationRate,
        base: body.base,
        target: body.target,
      });
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
      <p className="text-sm text-muted-foreground mb-4">
        Yatırımınızın enflasyondan arındırılmış gerçek getirisini hesaplayın.
        Yatırım başlangıç ve çekim dönemini seçin, TÜFE oranını biz
        hesaplayalım.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Yatırım Tutarı (₺)"
          type="number"
          step="0.01"
          placeholder="Örn. 100000"
          {...register('investment')}
          error={errors.investment?.message}
        />
        <Input
          label="Vade Sonundaki Tutar (₺)"
          type="number"
          step="0.01"
          placeholder="Örn. 150000"
          {...register('endValue')}
          error={errors.endValue?.message}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MonthYearPicker
            label="Yatırım Başlangıç Dönemi"
            value={base}
            onChange={(v) => {
              setValue('baseYear', v.year);
              setValue('baseMonth', v.month);
            }}
          />
          <MonthYearPicker
            label="Çekim Dönemi"
            value={target}
            onChange={(v) => {
              setValue('targetYear', v.year);
              setValue('targetMonth', v.month);
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Kaynak: TÜFE 2003=100 bazlı endeks (TCMB, tasci-api üzerinden).
          Enflasyon oranı otomatik hesaplanır.
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
            <ResultRow label="Dönem Enflasyonu" value={fmtPct(result.inflationRate)} />
            <ResultRow label="Nominal Getiri Oranı" value={fmtPct(result.nominal)} />
            <ResultRow label="Nominal Getiri Tutarı" value={fmtTL(result.nominalReturn)} />
            <ResultRow label="Reel Getiri Oranı" value={fmtPct(result.real)} highlight />
            <ResultRow label="Reel Getiri Tutarı" value={fmtTL(result.realReturn)} />
          </ResultCard>
        </>
      )}

      <ToolInfo
        title="Reel Getiri Nedir?"
        description="Reel getiri, bir yatırımın enflasyondan arındırılmış gerçek getirisini ifade eder. Fisher denklemi ile hesaplanır: Reel Getiri = (1 + Nominal Getiri) / (1 + Enflasyon) - 1"
        faqs={[
          { q: 'Reel getiri neden önemli?', a: 'Nominal getiri yanıltıcı olabilir. Reel getiri, paranızın satın alma gücünün gerçekten artıp artmadığını gösterir.' },
          { q: 'Negatif reel getiri ne demek?', a: 'Yatırımınızın enflasyonun altında kaldığı, satın alma gücünüzün azaldığı anlamına gelir.' },
        ]}
      />
    </>
  );
}