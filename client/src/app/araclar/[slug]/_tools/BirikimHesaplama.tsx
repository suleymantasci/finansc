'use client';
import { isToolHydrated } from './_shared/hydration';

import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { fmtTL } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';
import { ShareButton } from '@/components/shared/ShareButton';

const schema = z.object({
  currentSavings: z.coerce.number().min(0),
  monthlyDeposit: z.coerce.number().min(0),
  months: z.coerce.number().min(1, 'Süre giriniz'),
  yearlyReturn: z.coerce.number().min(0, 'Getiri oranı giriniz'),
});
type FormData = z.infer<typeof schema>;

const defaults: FormData = { currentSavings: 0, monthlyDeposit: 0, months: 0, yearlyReturn: 0 };

function readFormFromUrl(params: URLSearchParams): FormData {
  const num = (k: keyof FormData): number => {
    const v = params.get(k as string);
    if (v === null || v === '') return defaults[k];
    const n = Number(v);
    return Number.isFinite(n) ? n : defaults[k];
  };
  return {
    currentSavings: num('currentSavings'),
    monthlyDeposit: num('monthlyDeposit'),
    months: num('months'),
    yearlyReturn: num('yearlyReturn'),
  };
}

function writeFormToUrl(form: FormData) {
  if (typeof window === 'undefined') return;
  const sp = new URLSearchParams(window.location.search);
  for (const k of ['currentSavings', 'monthlyDeposit', 'months', 'yearlyReturn'] as (keyof FormData)[]) {
    const v = form[k];
    if (v === defaults[k] || v === 0) {
      sp.delete(k as string);
    } else {
      sp.set(k as string, String(v));
    }
  }
  const qs = sp.toString();
  window.history.replaceState(
    null, '',
    qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
  );
}

export function BirikimHesaplama() {
  return (
    <Suspense fallback={null}>
      <BirikimHesaplamaInner />
    </Suspense>
  );
}

function BirikimHesaplamaInner() {
  const initialForm = readFormFromUrl(
    typeof window !== 'undefined' && isToolHydrated() ? new URLSearchParams(window.location.search) : new URLSearchParams(),
  );
  const hasInitialData = initialForm.months > 0;
  const [result, setResult] = useState<{ total: number; deposits: number; interest: number } | null>(
    hasInitialData
      ? computeResult(initialForm)
      : null,
  );
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: initialForm,
  });

  const onSubmit = (data: FormData) => {
    setResult(computeResult(data));
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
      <p className="text-sm text-muted-foreground mb-4">Düzenli birikim yaparak belirli bir süre sonunda ulaşacağınız toplam tutarı hesaplayın.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Mevcut Birikim (₺)" type="number" step="0.01" defaultValue="0" {...register('currentSavings')} />
        <Input label="Aylık Birikim (₺)" type="number" step="0.01" placeholder="Örn. 5000" {...register('monthlyDeposit')} />
        <Input label="Birikim Süresi (Ay)" type="number" placeholder="Örn. 24" {...register('months')} error={errors.months?.message} />
        <Input label="Yıllık Reel Getiri (%)" type="number" step="0.01" placeholder="Örn. 15" {...register('yearlyReturn')} error={errors.yearlyReturn?.message} />
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
            <ResultRow label="Toplam Birikim" value={fmtTL(result.total)} highlight />
            <ResultRow label="Toplam Yatırdığınız" value={fmtTL(result.deposits)} />
            <ResultRow label="Kazanılan Getiri" value={fmtTL(result.interest)} />
          </ResultCard>
        </>
      )}

      <ToolInfo
        title="Birikim Hesaplama Nedir?"
        description="Düzenli olarak yapılan tasarrufların bileşik getiri ile birlikte belirli bir süre sonunda ne kadara ulaşacağını hesaplayan araçtır. Mevcut birikiminiz üzerine aylık eklenen tutarlar da getiri kazanır."
        faqs={[
          { q: 'Bileşik getiri nedir?', a: 'Kazanılan getirinin anaparaya eklenerek sonraki dönemlerde de getiri kazanmasıdır. Bu sayede birikimleriniz katlanarak büyür.' },
          { q: 'Reel getiri ne anlama gelir?', a: 'Enflasyondan arındırılmış gerçek getiridir. Paranın satın alma gücündeki artışı gösterir.' },
        ]}
      />
    </>
  );
}

function computeResult(data: FormData) {
  const monthlyRate = data.yearlyReturn / 100 / 12;
  let total = data.currentSavings;
  for (let i = 0; i < data.months; i++) {
    total = (total + data.monthlyDeposit) * (1 + monthlyRate);
  }
  const deposits = data.currentSavings + data.monthlyDeposit * data.months;
  return { total, deposits, interest: total - deposits };
}
