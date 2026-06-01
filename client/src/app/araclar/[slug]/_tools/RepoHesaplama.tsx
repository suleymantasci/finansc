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

export function RepoHesaplama() {
  const [result, setResult] = useState<{ grossReturn: number; tax: number; netReturn: number; total: number } | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<{ amount: number; rate: number; days: number }>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: { amount: number; rate: number; days: number }) => {
    const grossReturn = (data.amount * (data.rate / 100) * data.days) / 365;
    const tax = grossReturn * 0.15; // %15 stopaj
    const netReturn = grossReturn - tax;
    setResult({ grossReturn, tax, netReturn, total: data.amount + netReturn });
  };

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">Repo yatırımınızın getirisini hesaplayın. Repo getirisi üzerinden %15 stopaj kesintisi uygulanır.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Anapara (₺)" type="number" step="0.01" placeholder="Örn. 100000" {...register('amount')} error={errors.amount?.message} />
        <Input label="Yıllık Faiz Oranı (%)" type="number" step="0.01" placeholder="Örn. 45" {...register('rate')} error={errors.rate?.message} />
        <Input label="Gün Sayısı" type="number" placeholder="Örn. 7" {...register('days')} error={errors.days?.message} />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Hesapla</Button>
          <Button type="button" variant="outline" onClick={() => { reset(); setResult(null); }}>Sıfırla</Button>
        </div>
      </form>

      {result && (
        <ResultCard>
          <ResultRow label="Brüt Getiri" value={fmtTL(result.grossReturn)} />
          <ResultRow label="Stopaj (%15)" value={fmtTL(result.tax)} />
          <ResultRow label="Net Getiri" value={fmtTL(result.netReturn)} highlight />
          <ResultRow label="Vade Sonu Toplam" value={fmtTL(result.total)} />
        </ResultCard>
      )}

      <ToolInfo
        title="Repo Nedir?"
        description="Repo (Repurchase Agreement), menkul kıymetlerin geri alım vaadi ile satılmasıdır. Genellikle kısa vadeli (gecelik, haftalık) yatırım aracıdır. Getiri üzerinden %15 stopaj kesilir."
        faqs={[
          { q: 'Repo güvenli mi?', a: 'Repo, devlet tahvili gibi güvenilir menkul kıymetlere dayandığı için düşük risklidir.' },
          { q: 'Ters repo nedir?', a: 'Menkul kıymeti alan tarafın yaptığı işlemdir. Repo satan, ters repo alan olur.' },
        ]}
      />
    </>
  );
}
