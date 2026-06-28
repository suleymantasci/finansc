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
  days: z.coerce.number().min(1, 'Gün sayısı giriniz'),
});
type FormData = z.infer<typeof schema>;
type CalcResult = { grossReturn: number; tax: number; netReturn: number; total: number };
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

function compute(data: FormData): CalcResult {
  const grossReturn = (data.amount * (data.rate / 100) * data.days) / 365;
  const tax = grossReturn * 0.15;
  const netReturn = grossReturn - tax;
  return { grossReturn, tax, netReturn, total: data.amount + netReturn };
}

export function RepoHesaplama() {
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
      <p className="text-sm text-muted-foreground mb-4">Repo (geri alım vaadi) getirisini hesaplayın. Repo getirisi üzerinden %15 stopaj kesilir.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Anapara (₺)" type="number" step="0.01" placeholder="Örn. 100000" {...register('amount')} error={errors.amount?.message} />
        <Input label="Faiz Oranı (%)" type="number" step="0.01" placeholder="Örn. 35" {...register('rate')} error={errors.rate?.message} />
        <Input label="Vade (Gün)" type="number" placeholder="Örn. 30" {...register('days')} error={errors.days?.message} />
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
            <ResultRow label="Stopaj (%15)" value={fmtTL(result.tax)} />
            <ResultRow label="Net Getiri" value={fmtTL(result.netReturn)} highlight />
            <ResultRow label="Vade Sonu Toplam" value={fmtTL(result.total)} />
          </ResultCard>
        </>
      )}

      <ToolInfo
        title="Repo Nedir?"
        description="Repo (geri alım vaadi), menkul kıymetin belirli bir vadede geri alınması taahhüdüyle satılması işlemidir. Devlet tahvili, banka bonosu gibi garantili kıymetler üzerine yapılır. Getiri üzerinden %15 stopaj kesilir."
        faqs={[
          { q: 'Repo güvenli mi?', a: 'Devlet tahvili veya banka bonosu teminatlı olduğu için güvenli bir yatırımdır.' },
          { q: 'Bono, tahvil ve repo arasındaki fark nedir?', a: 'Bono 1 yıldan kısa, tahvil uzun vadeli devlet borçlanma senedidir. Repo ise geri alım vaadiyle yapılan kısa vadeli bir işlemdir.' },
        ]}
      />
    </>
  );
}
