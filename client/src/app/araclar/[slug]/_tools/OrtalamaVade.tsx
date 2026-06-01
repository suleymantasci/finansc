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
  count: z.coerce.number().min(2, 'En az 2 ödeme giriniz').max(50),
});

export function OrtalamaVade() {
  const [result, setResult] = useState<{ avgDays: number; totalAmount: number } | null>(null);
  const [payments, setPayments] = useState<{ days: number; amount: number }[]>([
    { days: 0, amount: 0 }, { days: 0, amount: 0 },
  ]);
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<{ count: number }>({
    resolver: zodResolver(schema), defaultValues: { count: 2 },
  });

  const count = watch('count');

  const handleCountChange = () => {
    const n = Math.min(Math.max(2, count || 2), 50);
    if (payments.length !== n) {
      const newP = [...payments];
      while (newP.length < n) newP.push({ days: 0, amount: 0 });
      setPayments(newP.slice(0, n));
    }
  };

  const onSubmit = () => {
    handleCountChange();
    const items = payments.slice(0, count || 2);
    const totalAmount = items.reduce((s, p) => s + p.amount, 0);
    if (totalAmount === 0) return;
    const weightedSum = items.reduce((s, p) => s + p.days * p.amount, 0);
    setResult({ avgDays: weightedSum / totalAmount, totalAmount });
  };

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">Çek ve senet gibi ödemelerin ağırlıklı ortalama vadesini hesaplayın.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Ödeme Sayısı" type="number" {...register('count', { onChange: handleCountChange })} error={errors.count?.message} />

        <div className="space-y-2">
          {Array.from({ length: Math.min(count || 2, 50) }).map((_, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-xs text-muted-foreground w-8">{i + 1}.</span>
              <input
                type="number" placeholder="Gün"
                value={payments[i]?.days || 0}
                onChange={(e) => {
                  const newP = [...payments];
                  while (newP.length <= i) newP.push({ days: 0, amount: 0 });
                  newP[i] = { ...newP[i], days: parseInt(e.target.value) || 0 };
                  setPayments(newP);
                }}
                className="flex h-8 w-24 rounded-md border border-border bg-background px-2 text-sm"
              />
              <span className="text-xs text-muted-foreground">gün</span>
              <input
                type="number" step="0.01" placeholder="Tutar (₺)"
                value={payments[i]?.amount || 0}
                onChange={(e) => {
                  const newP = [...payments];
                  while (newP.length <= i) newP.push({ days: 0, amount: 0 });
                  newP[i] = { ...newP[i], amount: parseFloat(e.target.value) || 0 };
                  setPayments(newP);
                }}
                className="flex h-8 flex-1 rounded-md border border-border bg-background px-2 text-sm"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Hesapla</Button>
          <Button type="button" variant="outline" onClick={() => { reset(); setResult(null); setPayments([{ days: 0, amount: 0 }, { days: 0, amount: 0 }]); }}>Sıfırla</Button>
        </div>
      </form>

      {result && (
        <ResultCard>
          <ResultRow label="Ortalama Vade" value={`${fmtNum(result.avgDays, 1)} gün`} highlight />
          <ResultRow label="Toplam Tutar" value={fmtTL(result.totalAmount)} />
        </ResultCard>
      )}

      <ToolInfo
        title="Ortalama Vade Nedir?"
        description="Ağırlıklı ortalama vade, birden fazla çek veya senedin tutarlarıyla ağırlıklandırılarak hesaplanan ortalama süredir. Formül: Σ(Tutar × Vade) / Σ(Tutar)."
        faqs={[
          { q: 'Ortalama vade ne işe yarar?', a: 'Birden fazla ödemeyi tek bir vadeye indirgeyerek finansal planlama yapmayı kolaylaştırır.' },
          { q: 'Ağırlıklı ortalama neden kullanılır?', a: 'Büyük tutarlı ödemelerin vadesi daha fazla ağırlık taşır, böylece gerçekçi bir ortalama elde edilir.' },
        ]}
      />
    </>
  );
}
