'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { simpleInterest, fmtTL } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';

const schema = z.object({
  principal: z.coerce.number().min(1, 'Anapara giriniz'),
  rate: z.coerce.number().min(0.01, 'Faiz oranı giriniz'),
  days: z.coerce.number().min(1, 'Vade giriniz'),
});

export function BonoHesaplama() {
  const [result, setResult] = useState<{ gross: number; tax: number; net: number } | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<{ principal: number; rate: number; days: number }>({ resolver: zodResolver(schema) });

  const onSubmit = (data: { principal: number; rate: number; days: number }) => {
    const gross = simpleInterest(data.principal, data.rate, data.days);
    const tax = gross * 0.15;
    setResult({ gross, tax, net: gross - tax });
  };

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">Hazine bonosu yatırımınızdan elde edeceğiniz getiriyi hesaplayın. Bono getirisi üzerinden %15 stopaj uygulanır.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Anapara (₺)" type="number" step="0.01" placeholder="Örn. 100000" {...register('principal')} error={errors.principal?.message} />
        <Input label="Yıllık Faiz Oranı (%)" type="number" step="0.01" placeholder="Örn. 25" {...register('rate')} error={errors.rate?.message} />
        <Input label="Vadeye Kalan Gün" type="number" placeholder="Örn. 90" {...register('days')} error={errors.days?.message} />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Hesapla</Button>
          <Button type="button" variant="outline" onClick={() => { reset(); setResult(null); }}>Sıfırla</Button>
        </div>
      </form>

      {result && (
        <ResultCard>
          <ResultRow label="Brüt Getiri" value={fmtTL(result.gross)} />
          <ResultRow label="Stopaj (%15)" value={fmtTL(result.tax)} />
          <ResultRow label="Net Getiri" value={fmtTL(result.net)} highlight />
        </ResultCard>
      )}

      <ToolInfo
        title="Bono Hesaplama Nedir?"
        description="Hazine bonosu, devletin kısa vadeli (1 yıla kadar) borçlanma aracıdır. Getirisi = (Anapara / 100) × (Faiz / 365) × Gün formülüyle hesaplanır. Brüt getiri üzerinden %15 stopaj kesilir."
        faqs={[
          { q: 'Bono ile tahvil arasındaki fark nedir?', a: 'Bono 1 yıldan kısa vadeli, tahvil 1 yıldan uzun vadeli devlet borçlanma aracıdır.' },
          { q: 'Bono güvenli midir?', a: 'Devlet garantisi altında olduğu için en güvenli yatırım araçlarından biridir.' },
        ]}
      />
    </>
  );
}
