'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { irr as calcIRR, fmtPct, fmtTL } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';

const schema = z.object({
  initialCost: z.coerce.number().min(1, 'Başlangıç maliyeti giriniz'),
  periods: z.coerce.number().min(1, 'Dönem sayısı giriniz').max(50),
});

export function IcVerimOrani() {
  const [result, setResult] = useState<number | null>(null);
  const [cashFlows, setCashFlows] = useState<number[]>([0]);
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<{ initialCost: number; periods: number }>({
    resolver: zodResolver(schema), defaultValues: { periods: 3 },
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

  const onSubmit = (data: { initialCost: number; periods: number }) => {
    handlePeriodsChange();
    const flows = cashFlows.slice(0, data.periods);
    const irrResult = calcIRR(flows, data.initialCost);
    setResult(irrResult !== null ? irrResult * 100 : null);
  };

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
          <Button type="button" variant="outline" onClick={() => { reset(); setResult(null); setCashFlows([0]); }}>Sıfırla</Button>
        </div>
      </form>

      {result !== null && (
        <ResultCard>
          <ResultRow label="İç Verim Oranı (IRR)" value={fmtPct(result)} highlight />
        </ResultCard>
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
