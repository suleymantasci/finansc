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

export function ParasalDeger() {
  const [result, setResult] = useState<{ newValue: number; change: number; rate: number } | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<{ amount: number; inflationRate: number }>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: { amount: number; inflationRate: number }) => {
    const rate = data.inflationRate / 100;
    const newValue = data.amount * (1 + rate);
    setResult({ newValue, change: newValue - data.amount, rate: data.inflationRate });
  };

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">Bir tutarın enflasyona göre güncellenmiş değerini hesaplayın. TÜİK tarafından açıklanan TÜFE veya Yİ-ÜFE endeks değişim oranını girebilirsiniz.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Para Tutarı (₺)" type="number" step="0.01" placeholder="Örn. 10000" {...register('amount')} error={errors.amount?.message} />
        <Input label="Endeks Değişim Oranı (%)" type="number" step="0.01" placeholder="Örn. 45.80" {...register('inflationRate')} error={errors.inflationRate?.message} />
        <p className="text-xs text-muted-foreground">Not: İki dönem arasındaki endeks değişim oranını TÜİK verilerinden hesaplayabilirsiniz: ((Yeni Endeks / Eski Endeks) - 1) × 100</p>
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Hesapla</Button>
          <Button type="button" variant="outline" onClick={() => { reset(); setResult(null); }}>Sıfırla</Button>
        </div>
      </form>

      {result && (
        <ResultCard>
          <ResultRow label="Değişim Oranı" value={fmtPct(result.rate)} />
          <ResultRow label="Güncellenmiş Değer" value={fmtTL(result.newValue)} highlight />
          <ResultRow label="Fark" value={fmtTL(result.change)} />
        </ResultCard>
      )}

      <ToolInfo
        title="Parasal Değer Nedir?"
        description="Parasal değer hesaplama, bir tutarın belirli dönemler arasındaki enflasyona göre güncellenmiş değerini bulmak için kullanılır. TÜİK tarafından açıklanan TÜFE ve Yİ-ÜFE endeks verileri kullanılarak hesaplanır."
        faqs={[
          { q: 'TÜFE nedir?', a: 'Tüketici Fiyat Endeksi, her ay TÜİK tarafından açıklanan fiyat değişim göstergesidir.' },
          { q: 'Yİ-ÜFE nedir?', a: 'Yurt İçi Üretici Fiyat Endeksi, üretici fiyatlarındaki değişimi ölçen göstergedir.' },
        ]}
      />
    </>
  );
}
