'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { irr as calcIRR, fmtPct } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';
import { ShareButton } from '@/components/shared/ShareButton';

const schema = z.object({
  initialCost: z.coerce.number().min(1, 'Başlangıç maliyeti giriniz'),
  periods: z.coerce.number().min(1, 'Dönem sayısı giriniz').max(50),
});
type FormData = z.infer<typeof schema>;
const defaults: FormData = { initialCost: 0, periods: 3 };

function readFormFromUrl(): { form: FormData; flows: number[] } {
  if (typeof window === 'undefined') return { form: defaults, flows: [0] };
  const sp = new URLSearchParams(window.location.search);
  const num = (k: keyof FormData): number => {
    const v = sp.get(k as string);
    if (v === null || v === '') return defaults[k] as number;
    const n = Number(v);
    return Number.isFinite(n) ? n : (defaults[k] as number);
  };
  const form: FormData = { initialCost: num('initialCost'), periods: num('periods') };
  // Cashflows: cf=1000,2000,3000
  const cfRaw = sp.get('cf');
  let flows: number[] = [0];
  if (cfRaw) {
    flows = cfRaw.split(',').map((v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    });
  }
  return { form, flows };
}

function writeFormToUrl(form: FormData, flows: number[]) {
  if (typeof window === 'undefined') return;
  const sp = new URLSearchParams(window.location.search);
  // Form alanları
  for (const k of ['initialCost', 'periods'] as (keyof FormData)[]) {
    const v = form[k];
    const def = defaults[k];
    if (v === def || (typeof v === 'number' && v === 0)) sp.delete(k as string);
    else sp.set(k as string, String(v));
  }
  // Cashflows
  const nonzero = flows.some((f) => f !== 0);
  if (nonzero) {
    let last = flows.length - 1;
    while (last > 0 && flows[last] === 0) last--;
    sp.set('cf', flows.slice(0, last + 1).join(','));
  } else {
    sp.delete('cf');
  }
  const qs = sp.toString();
  window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
}

export function IcVerimOrani() {
  const { form: initialForm, flows: initialFlows } = readFormFromUrl();
  const [cashFlows, setCashFlows] = useState<number[]>(initialFlows);
  const [result, setResult] = useState<number | null>(
    initialForm.initialCost > 0 && initialFlows.some((f) => f !== 0)
      ? (() => {
          const r = calcIRR(initialFlows.slice(0, initialForm.periods), initialForm.initialCost);
          return r !== null ? r * 100 : null;
        })()
      : null,
  );
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: initialForm,
  });

  const periods = watch('periods');

  const handlePeriodsChange = () => {
    const n = Math.min(Math.max(1, periods || 1), 50);
    if (cashFlows.length !== n) {
      const newFlows = [...cashFlows];
      while (newFlows.length < n) newFlows.push(0);
      setCashFlows(newFlows.slice(0, n));
    }
  };

  const onSubmit = (data: FormData) => {
    handlePeriodsChange();
    const flows = cashFlows.slice(0, data.periods);
    const irrResult = calcIRR(flows, data.initialCost);
    setResult(irrResult !== null ? irrResult * 100 : null);
    writeFormToUrl(data, flows);
  };

  const handleReset = () => {
    reset();
    setResult(null);
    setCashFlows([0]);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}${window.location.search}`
    : '';

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">İç verim oranı (IRR), bir yatırımın net bugünkü değerini sıfır yapan iskonto oranıdır.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Başlangıç Maliyeti (₺)" type="number" step="0.01" placeholder="Örn. 100000" {...register('initialCost')} error={errors.initialCost?.message} />
        <Input label="Dönem Sayısı" type="number" {...register('periods', { onChange: handlePeriodsChange })} error={errors.periods?.message} />

        <div className="space-y-2">
          <p className="text-sm font-medium">Dönem Nakit Akışları (₺)</p>
          {Array.from({ length: Math.min(periods || 1, 50) }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-16">Dönem {i + 1}:</span>
              <input
                type="number"
                step="0.01"
                value={cashFlows[i] || 0}
                onChange={(e) => {
                  const newFlows = [...cashFlows];
                  while (newFlows.length <= i) newFlows.push(0);
                  newFlows[i] = parseFloat(e.target.value) || 0;
                  setCashFlows(newFlows);
                }}
                className="flex h-8 w-full rounded-md border border-border bg-background px-2 text-sm"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Hesapla</Button>
          <Button type="button" variant="outline" onClick={handleReset}>Sıfırla</Button>
        </div>
      </form>

      {result !== null && (
        <>
          <div className="flex items-center justify-between gap-2 mt-6 flex-wrap">
            <p className="text-sm text-muted-foreground">Sonucu paylaş — link'i kopyalayıp gönderebilirsiniz.</p>
            <ShareButton shareUrl={shareUrl} />
          </div>
          <ResultCard>
            <ResultRow label="İç Verim Oranı (IRR)" value={fmtPct(result)} highlight />
          </ResultCard>
        </>
      )}

      <ToolInfo
        title="İç Verim Oranı (IRR) Nedir?"
        description="İç verim oranı (Internal Rate of Return), bir yatırımın net bugünkü değerini sıfır yapan iskonto oranıdır. Yatırımın karlılığını değerlendirmek için kullanılır."
        faqs={[
          { q: 'IRR nasıl yorumlanır?', a: 'IRR, yatırımın getiri oranını temsil eder. IRR, sermaye maliyetinden yüksekse yatırım karlıdır.' },
          { q: 'IRR ile NPV farkı nedir?', a: 'NPV parasal değer verir, IRR ise yüzdesel oran verir. İkisi birlikte kullanılmalıdır.' },
        ]}
      />
    </>
  );
}
