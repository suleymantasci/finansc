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
  amount: z.coerce.number().min(1, 'Anapara giriniz'),
  rate: z.coerce.number().min(0.01, 'Faiz oranı giriniz'),
  days: z.coerce.number().min(1, 'Vade giriniz'),
});
type FormData = z.infer<typeof schema>;
type CalcResult = { grossReturn: number; tax: number; netReturn: number; total: number; stopajRate: number };
const defaults: FormData = { amount: 0, rate: 0, days: 0 };

function readFormFromUrl(): FormData {
  if (typeof window === 'undefined') return defaults;
  const sp = new URLSearchParams(window.location.search);
  const num = (k: keyof FormData): number => {
    const v = sp.get(k as string);
    if (v === null || v === '') return defaults[k];
    const n = Number(v);
    return Number.isFinite(n) ? n : defaults[k];
  };
  return { amount: num('amount'), rate: num('rate'), days: num('days') };
}

function writeFormToUrl(form: FormData) {
  if (typeof window === 'undefined') return;
  const sp = new URLSearchParams(window.location.search);
  for (const k of ['amount', 'rate', 'days'] as (keyof FormData)[]) {
    const v = form[k];
    if (v === 0) sp.delete(k as string);
    else sp.set(k as string, String(v));
  }
  const qs = sp.toString();
  window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
}

function getStopajRate(days: number): number {
  if (days <= 180) return 0.175;
  if (days <= 365) return 0.15;
  return 0.10;
}

function compute(data: FormData): CalcResult {
  const grossReturn = (data.amount * (data.rate / 100) * data.days) / 365;
  const stopajRate = getStopajRate(data.days);
  const tax = grossReturn * stopajRate;
  const netReturn = grossReturn - tax;
  return { grossReturn, tax, netReturn, total: data.amount + netReturn, stopajRate: stopajRate * 100 };
}

export function VadeliMevduat() {
  const initialForm = readFormFromUrl();
  const [result, setResult] = useState<CalcResult | null>(
    initialForm.amount > 0 && initialForm.rate > 0 && initialForm.days > 0 ? compute(initialForm) : null,
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
      <p className="text-sm text-muted-foreground mb-4">Vadeli mevduat hesabınızın getirisini hesaplayın. Vadeye göre farklı stopaj oranları uygulanır.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Anapara (₺)" type="number" step="0.01" placeholder="Örn. 100000" {...register('amount')} error={errors.amount?.message} />
        <Input label="Yıllık Faiz Oranı (%)" type="number" step="0.01" placeholder="Örn. 45" {...register('rate')} error={errors.rate?.message} />
        <Input label="Vade (Gün)" type="number" placeholder="Örn. 32" {...register('days')} error={errors.days?.message} />
        <p className="text-xs text-muted-foreground">Stopaj: ≤6 ay → %17,5 | 6-12 ay → %15 | &gt;12 ay → %10</p>
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
            <ResultRow label="Brüt Getiri" value={fmtTL(result.grossReturn)} />
            <ResultRow label={`Stopaj (%${result.stopajRate})`} value={fmtTL(result.tax)} />
            <ResultRow label="Net Getiri" value={fmtTL(result.netReturn)} highlight />
            <ResultRow label="Vade Sonu Toplam" value={fmtTL(result.total)} />
          </ResultCard>
        </>
      )}

      <ToolInfo
        title="Vadeli Mevduat Nedir?"
        description="Vadeli mevduat, belirli bir süre için bankaya yatırılan ve vade sonunda faiz getirisi elde edilen tasarruf ürünüdür. Getiri üzerinden vadeye bağlı olarak %10-15 arası stopaj kesilir."
        faqs={[
          { q: 'Stopaj oranları nasıl belirlenir?', a: '6 aya kadar %15, 6-12 ay arası %12, 12 aydan uzun vadede %10 stopaj uygulanır.' },
          { q: 'Vadeli mevduat güvencesi var mı?', a: 'TMSF (Tasarruf Mevduatı Sigorta Fonu) kapsamında kişi başı 600.000 TL\'ye kadar güvence altındadır.' },
          { q: 'Vade bozulursa ne olur?', a: 'Banka genellikle vadesiz mevduat faizi uygular veya hiç faiz ödemez.' },
        ]}
      />
    </>
  );
}
