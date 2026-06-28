'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { fmtTL } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';
import { ShareButton } from '@/components/shared/ShareButton';

const schema = z.object({
  type: z.string(),
  principal: z.coerce.number().min(1, 'Anapara giriniz'),
  rate: z.coerce.number().min(0.01, 'Faiz oranı giriniz'),
  periods: z.coerce.number().min(1, 'Dönem sayısı giriniz'),
});
type FormData = z.infer<typeof schema>;

const defaults: FormData = { type: 'simple', principal: 0, rate: 0, periods: 0 };

function readFormFromUrl(): FormData {
  if (typeof window === 'undefined') return defaults;
  const sp = new URLSearchParams(window.location.search);
  const num = (k: keyof FormData): number => {
    const v = sp.get(k as string);
    if (v === null || v === '') return defaults[k] as number;
    const n = Number(v);
    return Number.isFinite(n) ? n : (defaults[k] as number);
  };
  return {
    type: sp.get('type') ?? defaults.type,
    principal: num('principal'),
    rate: num('rate'),
    periods: num('periods'),
  };
}

function writeFormToUrl(form: FormData) {
  if (typeof window === 'undefined') return;
  const sp = new URLSearchParams(window.location.search);
  for (const k of ['type', 'principal', 'rate', 'periods'] as (keyof FormData)[]) {
    const v = form[k];
    const def = defaults[k];
    if (v === def || (typeof v === 'number' && v === 0)) {
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

export function FaizHesaplama() {
  const initialForm = readFormFromUrl();
  const hasInitialData = initialForm.principal > 0 && initialForm.periods > 0;
  const [result, setResult] = useState<{ interest: number; total: number } | null>(
    hasInitialData ? computeFaiz(initialForm) : null,
  );
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: initialForm,
  });

  const onSubmit = (data: FormData) => {
    setResult(computeFaiz(data));
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
      <p className="text-sm text-muted-foreground mb-4">Basit veya bileşik faiz ile yatırım getirinizi hesaplayın.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select label="Faiz Türü" options={[
          { value: 'simple', label: 'Basit Faiz' },
          { value: 'compound', label: 'Bileşik Faiz' },
        ]} {...register('type')} />
        <Input label="Anapara (₺)" type="number" step="0.01" placeholder="Örn. 100000" {...register('principal')} error={errors.principal?.message} />
        <Input label="Faiz Oranı (% / Dönem)" type="number" step="0.01" placeholder="Örn. 3.5" {...register('rate')} error={errors.rate?.message} />
        <Input label="Dönem Sayısı" type="number" placeholder="Örn. 12" {...register('periods')} error={errors.periods?.message} />
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
            <ResultRow label="Faiz Getirisi" value={fmtTL(result.interest)} />
            <ResultRow label="Toplam Tutar" value={fmtTL(result.total)} highlight />
          </ResultCard>
        </>
      )}

      <ToolInfo
        title="Faiz Hesaplama Nedir?"
        description="Basit faizde getiri = Anapara × Oran × Dönem formülüyle hesaplanır. Bileşik faizde ise her dönem kazanılan faiz anaparaya eklenerek sonraki dönemde de faiz kazanır: Toplam = Anapara × (1 + Oran)^Dönem."
        faqs={[
          { q: 'Basit ve bileşik faiz farkı nedir?', a: 'Basit faizde getiri her dönem sabit kalır. Bileşik faizde ise faiz üzerine de faiz işler, bu nedenle getiri katlanarak artar.' },
          { q: 'Hangi faiz türü daha avantajlıdır?', a: 'Yatırımcı için bileşik faiz daha avantajlıdır çünkü kazanılan faiz de faiz getirir.' },
        ]}
      />
    </>
  );
}

function computeFaiz(data: FormData) {
  const r = data.rate / 100;
  if (data.type === 'simple') {
    const interest = data.principal * r * data.periods;
    return { interest, total: data.principal + interest };
  } else {
    const total = data.principal * Math.pow(1 + r, data.periods);
    return { interest: total - data.principal, total };
  }
}
