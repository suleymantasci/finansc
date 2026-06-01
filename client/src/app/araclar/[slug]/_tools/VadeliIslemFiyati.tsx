'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { fmtTL, fmtNum } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';

const schema = z.object({
  spotPrice: z.coerce.number().min(0.01, 'Spot fiyat giriniz'),
  dividendYield: z.coerce.number().min(0, 'Temettü verimi giriniz'),
  days: z.coerce.number().min(1, 'Vade giriniz'),
  riskFreeRate: z.coerce.number().min(0, 'Risksiz faiz oranı giriniz'),
});

export function VadeliIslemFiyati() {
  const [result, setResult] = useState<{ theoreticalPrice: number; costOfCarry: number } | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<{ spotPrice: number; dividendYield: number; days: number; riskFreeRate: number }>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: { spotPrice: number; dividendYield: number; days: number; riskFreeRate: number }) => {
    const r = data.riskFreeRate / 100;
    const d = data.dividendYield / 100;
    const t = data.days / 365;
    // Teorik Vadeli Fiyat = Spot × (1 + (r - d) × t)
    const theoreticalPrice = data.spotPrice * (1 + (r - d) * t);
    const costOfCarry = theoreticalPrice - data.spotPrice;
    setResult({ theoreticalPrice, costOfCarry });
  };

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">Vadeli işlem (futures) sözleşmesinin teorik fiyatını hesaplayın. Taşıma maliyeti modeli kullanılır.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Dayanak Varlık (Spot) Fiyatı (₺)" type="number" step="0.01" placeholder="Örn. 100" {...register('spotPrice')} error={errors.spotPrice?.message} />
        <Input label="Temettü Verimi (% / Yıl)" type="number" step="0.01" placeholder="Örn. 2" {...register('dividendYield')} error={errors.dividendYield?.message} />
        <Input label="Vadeye Kalan Gün" type="number" placeholder="Örn. 90" {...register('days')} error={errors.days?.message} />
        <Input label="Risksiz Faiz Oranı (% / Yıl)" type="number" step="0.01" placeholder="Örn. 45" {...register('riskFreeRate')} error={errors.riskFreeRate?.message} />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Hesapla</Button>
          <Button type="button" variant="outline" onClick={() => { reset(); setResult(null); }}>Sıfırla</Button>
        </div>
      </form>

      {result && (
        <ResultCard>
          <ResultRow label="Teorik Vadeli Fiyat" value={fmtTL(result.theoreticalPrice)} highlight />
          <ResultRow label="Taşıma Maliyeti" value={fmtTL(result.costOfCarry)} />
        </ResultCard>
      )}

      <ToolInfo
        title="Vadeli İşlem Fiyatı Nedir?"
        description="Vadeli işlem (futures) sözleşmesinin teorik fiyatı, taşıma maliyeti modeliyle hesaplanır. Formül: F = S × (1 + (r - d) × t), burada S spot fiyat, r risksiz faiz, d temettü verimi, t vadedir."
        faqs={[
          { q: 'Taşıma maliyeti nedir?', a: 'Dayanak varlığı elde tutmanın maliyetidir (finansman maliyeti - temettü geliri).' },
          { q: 'Teorik fiyat ile piyasa fiyatı neden farklı olabilir?', a: 'Arz-talep dengesizliği, likidite farkı ve beklentiler gibi nedenlerle sapma olabilir.' },
        ]}
      />
    </>
  );
}
