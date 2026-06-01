'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { fmtTL, fmtPct } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';

const schema = z.object({
  amount: z.coerce.number().min(0.01, 'Tutar giriniz'),
  inflationRate: z.coerce.number().min(0, 'Enflasyon oranı giriniz'),
});

export function EnflasyonHesaplama() {
  const [result, setResult] = useState<{ newValue: number; loss: number }| null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<{ amount: number; inflationRate: number }>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: { amount: number; inflationRate: number }) => {
    const rate = data.inflationRate / 100;
    const newValue = data.amount * (1 + rate);
    const loss = newValue - data.amount;
    setResult({ newValue, loss });
  };

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">Enflasyon oranına göre paranızın değer değişimini hesaplayın. TÜİK tarafından açıklanan TÜFE oranını veya özel bir oran girebilirsiniz.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Mal Sepeti / Tutar (₺)" type="number" step="0.01" placeholder="Örn. 10000" {...register('amount')} error={errors.amount?.message} />
        <Input label="Enflasyon Oranı (%)" type="number" step="0.01" placeholder="Örn. 45.80" {...register('inflationRate')} error={errors.inflationRate?.message} />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Hesapla</Button>
          <Button type="button" variant="outline" onClick={() => { reset(); setResult(null); }}>Sıfırla</Button>
        </div>
      </form>

      {result && (
        <ResultCard>
          <ResultRow label="Yeni Değer" value={fmtTL(result.newValue)} />
          <ResultRow label="Fark" value={fmtTL(result.loss)} highlight />
        </ResultCard>
      )}

      <ToolInfo
        title="Enflasyon Hesaplama Nedir?"
        description="Enflasyon hesaplama aracı, belirli bir tutarın enflasyon oranına göre yeni değerini hesaplar. TÜİK tarafından açıklanan TÜFE 12 aylık ortalamalara göre değişim oranını kullanabilirsiniz."
        faqs={[
          { q: 'TÜFE nedir?', a: 'Tüketici Fiyat Endeksi\'nin kısaltmasıdır. Her ay TÜİK tarafından açıklanan fiyat artış oranıdır.' },
          { q: 'Enflasyon neden önemlidir?', a: 'Paranın satın alma gücünü doğrudan etkiler. Yüksek enflasyon dönemlerinde aynı para ile daha az ürün/hizmet alınabilir.' },
        ]}
      />
    </>
  );
}
