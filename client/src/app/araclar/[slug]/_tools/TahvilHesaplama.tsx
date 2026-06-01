'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { fmtTL } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';

const schema = z.object({
  amount: z.coerce.number().min(1, 'Anapara giriniz'),
  rate: z.coerce.number().min(0.01, 'Faiz oranı giriniz'),
  days: z.coerce.number().min(1, 'Gün sayısı giriniz'),
});

export function TahvilHesaplama() {
  const [result, setResult] = useState<{ grossReturn: number; tax: number; netReturn: number; total: number } | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<{ amount: number; rate: number; days: number }>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: { amount: number; rate: number; days: number }) => {
    const grossReturn = (data.amount * (data.rate / 100) * data.days) / 365;
    const tax = grossReturn * 0.10; // Tahvil stopajı %10
    const netReturn = grossReturn - tax;
    setResult({ grossReturn, tax, netReturn, total: data.amount + netReturn });
  };

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">Devlet tahvili getirinizi hesaplayın. Tahvil getirisi üzerinden %10 stopaj kesintisi uygulanır.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Anapara (₺)" type="number" step="0.01" placeholder="Örn. 100000" {...register('amount')} error={errors.amount?.message} />
        <Input label="Yıllık Faiz Oranı (%)" type="number" step="0.01" placeholder="Örn. 30" {...register('rate')} error={errors.rate?.message} />
        <Input label="Vade (Gün)" type="number" placeholder="Örn. 365" {...register('days')} error={errors.days?.message} />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Hesapla</Button>
          <Button type="button" variant="outline" onClick={() => { reset(); setResult(null); }}>Sıfırla</Button>
        </div>
      </form>

      {result && (
        <ResultCard>
          <ResultRow label="Brüt Getiri" value={fmtTL(result.grossReturn)} />
          <ResultRow label="Stopaj (%10)" value={fmtTL(result.tax)} />
          <ResultRow label="Net Getiri" value={fmtTL(result.netReturn)} highlight />
          <ResultRow label="Vade Sonu Toplam" value={fmtTL(result.total)} />
        </ResultCard>
      )}

      <ToolInfo
        title="Tahvil Nedir?"
        description="Devlet tahvili, devletin borçlanma amacıyla çıkardığı uzun vadeli (genellikle 1 yıl ve üzeri) borçlanma senetleridir. Sabit veya değişken faizli olabilir. Getiri üzerinden %10 stopaj kesilir."
        faqs={[
          { q: 'Tahvil ile bono arasındaki fark nedir?', a: 'Tahvil 1 yıl ve üzeri vadeli, hazine bonosu 1 yıldan kısa vadeli devlet borçlanma senedidir. Stopaj oranları da farklıdır (tahvil %10, bono %15).' },
          { q: 'Tahvil güvenli mi?', a: 'Devlet garantisinde olduğu için en düşük riskli yatırım araçlarından biridir.' },
        ]}
      />
    </>
  );
}
