'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { fmtTL } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';
import { ShareButton } from '@/components/shared/ShareButton';

const schema = z.object({
  amount: z.coerce.number().min(0.01, 'Tutar giriniz'),
  inflationRate: z.coerce.number().min(0, 'Enflasyon oranı giriniz'),
});
type FormData = z.infer<typeof schema>;

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
    if (v === defaults[k]) sp.delete(k as string);
    else sp.set(k as string, String(v));
  }
  const qs = sp.toString();
  window.history.replaceState(
    null, '',
    qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
  );
}

export function EnflasyonHesaplama() {
  const initialForm = readFormFromUrl();
  const hasInitialData = initialForm.amount > 0 && initialForm.inflationRate > 0;
  const [result, setResult] = useState<{ newValue: number; loss: number } | null>(
    hasInitialData ? computeEnflasyon(initialForm) : null,
  );
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: initialForm,
  });

  const onSubmit = (data: FormData) => {
    setResult(computeEnflasyon(data));
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
      <p className="text-sm text-muted-foreground mb-4">Enflasyon oranına göre paranızın değer değişimini hesaplayın. TÜİK tarafından açıklanan TÜFE oranını veya özel bir oran girebilirsiniz.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Mal Sepeti / Tutar (₺)" type="number" step="0.01" placeholder="Örn. 10000" {...register('amount')} error={errors.amount?.message} />
        <Input label="Enflasyon Oranı (%)" type="number" step="0.01" placeholder="Örn. 45.80" {...register('inflationRate')} error={errors.inflationRate?.message} />
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
            <ResultRow label="Yeni Değer" value={fmtTL(result.newValue)} />
            <ResultRow label="Fark" value={fmtTL(result.loss)} highlight />
          </ResultCard>
        </>
      )}

      <ToolInfo
        title="Enflasyon Hesaplama Nedir?"
        description="Enflasyon hesaplama aracı, belirli bir tutarın enflasyon oranına göre yeni değerini hesaplar. TÜİK tarafından açıklanan TÜFE 12 aylık ortalamalara göre değişim oranını kullanabilirsiniz."
        faqs={[
          { q: 'TÜFE nedir?', a: 'Tüketici Fiyat Endeksi\'nin kısaltmasıdır. Her ay TÜİK tarafından açıklanan fiyat artış oranıdır.' },
          { q: 'Enflasyon neden önemlidir?', a: 'Paranın satın alma gücünü doğrudan etkiler. Yüksek enflasyon dönemlerinde aynı para ile daha az ürün/hizmet alınabilir.' },
        ]}
      />
    </>
  );
}

function computeEnflasyon(data: FormData) {
  const rate = data.inflationRate / 100;
  const newValue = data.amount * (1 + rate);
  return { newValue, loss: newValue - data.amount };
}
