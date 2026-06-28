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

const schema = z.object({
  amount: z.coerce.number().min(0.01, 'Tutar giriniz'),
  inflationRate: z.coerce.number().min(0, 'Enflasyon oranı giriniz'),
});
type FormData = z.infer<typeof schema>;
type CalcResult = { newValue: number; change: number; rate: number };
const defaults: FormData = { amount: 0, inflationRate: 0 };

function readFormFromUrl(): FormData {
  if (typeof window === 'undefined') return defaults;
  const sp = new URLSearchParams(window.location.search);
  const num = (k: keyof FormData): number => {
    const v = sp.get(k as string);
    if (v === null || v === '') return defaults[k];
    const n = Number(v);
    return Number.isFinite(n) ? n : defaults[k];
  };
  return { amount: num('amount'), inflationRate: num('inflationRate') };
}

function writeFormToUrl(form: FormData) {
  if (typeof window === 'undefined') return;
  const sp = new URLSearchParams(window.location.search);
  for (const k of ['amount', 'inflationRate'] as (keyof FormData)[]) {
    const v = form[k];
    if (v === 0) sp.delete(k as string);
    else sp.set(k as string, String(v));
  }
  const qs = sp.toString();
  window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
}

function compute(data: FormData): CalcResult {
  const rate = data.inflationRate / 100;
  const newValue = data.amount * (1 + rate);
  return { newValue, change: newValue - data.amount, rate: data.inflationRate };
}

export function ParasalDeger() {
  const initialForm = readFormFromUrl();
  const [result, setResult] = useState<CalcResult | null>(
    initialForm.amount > 0 && initialForm.inflationRate > 0 ? compute(initialForm) : null,
  );
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: initialForm });

  const onSubmit = (data: FormData) => {
    setResult(compute(data));
    writeFormToUrl(data);
  };

  const handleReset = () => {
    reset();
    setResult(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}${window.location.search}`
    : '';

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">Bir tutarın enflasyona göre güncellenmiş değerini hesaplayın. TÜİK tarafından açıklanan TÜFE veya Yİ-ÜFE endeks değişim oranını girebilirsiniz.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Para Tutarı (₺)" type="number" step="0.01" placeholder="Örn. 10000" {...register('amount')} error={errors.amount?.message} />
        <Input label="Endeks Değişim Oranı (%)" type="number" step="0.01" placeholder="Örn. 45.80" {...register('inflationRate')} error={errors.inflationRate?.message} />
        <p className="text-xs text-muted-foreground">Not: İki dönem arasındaki endeks değişim oranını TÜİK verilerinden hesaplayabilirsiniz: ((Yeni Endeks / Eski Endeks) - 1) × 100</p>
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Hesapla</Button>
          <Button type="button" variant="outline" onClick={handleReset}>Sıfırla</Button>
        </div>
      </form>

      {result && (
        <>
          <div className="flex items-center justify-between gap-2 mt-6 flex-wrap">
            <p className="text-sm text-muted-foreground">Sonucu paylaş — link'i kopyalayıp gönderebilirsiniz.</p>
            <ShareButton shareUrl={shareUrl} />
          </div>
          <ResultCard>
            <ResultRow label="Değişim Oranı" value={fmtPct(result.rate)} />
            <ResultRow label="Güncellenmiş Değer" value={fmtTL(result.newValue)} highlight />
            <ResultRow label="Fark" value={fmtTL(result.change)} />
          </ResultCard>
        </>
      )}

      <ToolInfo
        title="Parasal Değer Nedir?"
        description="Parasal değer hesaplama, bir tutarın belirli dönemler arasındaki enflasyona göre güncellenmiş değerini bulmak için kullanılır. TÜİK tarafından açıklanan TÜFE ve Yİ-ÜFE endeks verileri kullanılarak hesaplanır."
        faqs={[
          { q: 'TÜFE nedir?', a: 'Tüketici Fiyat Endeksi, her ay TÜİK tarafından açıklanan fiyat değişim göstergesidir.' },
          { q: 'Yİ-ÜFE nedir?', a: 'Yurt İçi Üretici Fiyat Endeksi, üretici fiyatlarındaki değişimi ölçen göstergedir.' },
        ]}
      />
    </>
  );
}
