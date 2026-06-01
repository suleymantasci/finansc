'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { npv as calcNPV, fmtTL, fmtPct } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';

const schema = z.object({
  discountRate: z.coerce.number().min(0, 'İskonto oranı giriniz'),
  periods: z.coerce.number().min(1, 'Dönem sayısı giriniz').max(50),
});

export function NetBugunKuDeger() {
  const [result, setResult] = useState<number | null>(null);
  const [cashFlows, setCashFlows] = useState<number[]>([0]);
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<{ discountRate: number; periods: number }>({
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

  const onSubmit = (data: { discountRate: number; periods: number }) => {
    handlePeriodsChange();
    const flows = cashFlows.slice(0, data.periods);
    const r = data.discountRate / 100;
    setResult(calcNPV(r, flows));
  };

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">Net bugünkü değer (NBD/NPV), gelecekteki nakit akışlarının bugünkü değerini hesaplar.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Dönemsel İskonto (Faiz) Oranı (%)" type="number" step="0.01" placeholder="Örn. 10" {...register('discountRate')} error={errors.discountRate?.message} />
        <Input label="Dönem Sayısı" type="number" {...register('periods', { onChange: handlePeriodsChange })} error={errors.periods?.message} />

        <div className="space-y-2">
          <p className="text-sm font-medium">Dönem Nakit Akışları (₺)</p>
          {Array.from({ length: Math.min(periods || 1, 50) }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-16">Dönem {i + 1}:</span>
              <input
                type="number" step="0.01"
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
          <ResultRow label="Net Bugünkü Değer (NPV)" value={fmtTL(result)} highlight />
        </ResultCard>
      )}

      <ToolInfo
        title="Net Bugünkü Değer (NPV) Nedir?"
        description="NPV, gelecekteki nakit akışlarının belirli bir iskonto oranı ile bugünkü değerine indirgenmesiyle hesaplanır. Formül: NPV = Σ (CF_t / (1+r)^t). Pozitif NPV, yatırımın karlı olduğunu gösterir."
        faqs={[
          { q: 'NPV pozitifse ne anlama gelir?', a: 'Yatırımın beklenen getirisi, sermaye maliyetinden yüksektir ve yatırım değer yaratır.' },
          { q: 'İskonto oranı nasıl seçilir?', a: 'Genellikle sermaye maliyeti (WACC) veya alternatif yatırımın getiri oranı kullanılır.' },
        ]}
      />
    </>
  );
}
