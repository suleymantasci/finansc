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
  contractRate: z.coerce.number().min(0.01, 'Akdi faiz oranı giriniz'),
  delayRate: z.coerce.number().min(0.01, 'Gecikme faiz oranı giriniz'),
  debt: z.coerce.number().min(1, 'Borç tutarı giriniz'),
  payment: z.coerce.number().min(0, 'Ödeyeceğiniz tutar giriniz'),
  delayDays: z.coerce.number().min(1, 'Gecikme süresi giriniz').max(30, 'Maks 30 gün'),
});
type FormData = z.infer<typeof schema>;

export function KrediKartiGecikmeFaizi() {
  const [result, setResult] = useState<{ delayInterest: number; bsmv: number; kkdf: number; total: number } | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: { contractRate: 3.75, delayRate: 4.05 },
  });

  const onSubmit = (data: FormData) => {
    const remaining = data.debt - data.payment;
    if (remaining <= 0) { setResult({ delayInterest: 0, bsmv: 0, kkdf: 0, total: 0 }); return; }
    const dailyRate = data.delayRate / 100 / 30;
    const delayInterest = remaining * dailyRate * data.delayDays;
    const bsmv = delayInterest * 0.15;
    const kkdf = delayInterest * 0.15;
    setResult({ delayInterest, bsmv, kkdf, total: remaining + delayInterest + bsmv + kkdf });
  };

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">Kredi kartı borcunuzu geç ödemeniz durumunda oluşacak gecikme faizini hesaplayın.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Akdi Faiz Oranı (%)" type="number" step="0.01" defaultValue="3.75" {...register('contractRate')} error={errors.contractRate?.message} />
        <Input label="Gecikme Faiz Oranı (%)" type="number" step="0.01" defaultValue="4.05" {...register('delayRate')} error={errors.delayRate?.message} />
        <Input label="Dönem Borcu (₺)" type="number" step="0.01" placeholder="Örn. 10000" {...register('debt')} error={errors.debt?.message} />
        <Input label="Ödeyeceğiniz Tutar (₺)" type="number" step="0.01" placeholder="Örn. 2000" {...register('payment')} error={errors.payment?.message} />
        <Input label="Gecikme Süresi (Gün, maks 30)" type="number" placeholder="Örn. 10" {...register('delayDays')} error={errors.delayDays?.message} />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Hesapla</Button>
          <Button type="button" variant="outline" onClick={() => { reset(); setResult(null); }}>Sıfırla</Button>
        </div>
      </form>

      {result && (
        <ResultCard>
          <ResultRow label="Gecikme Faizi" value={fmtTL(result.delayInterest)} highlight />
          <ResultRow label="BSMV (%15)" value={fmtTL(result.bsmv)} />
          <ResultRow label="KKDF (%15)" value={fmtTL(result.kkdf)} />
          <ResultRow label="Toplam Ödenecek" value={fmtTL(result.total)} />
        </ResultCard>
      )}

      <ToolInfo
        title="Kredi Kartı Gecikme Faizi Nedir?"
        description="Kredi kartı borcunun son ödeme tarihinde ödenmemesi durumunda uygulanan faizdir. Gecikme faiz oranı akdi faiz oranından daha yüksektir. Faiz üzerinden ayrıca BSMV %15 ve KKDF %15 alınır."
        faqs={[
          { q: 'Gecikme faizi ne zaman başlar?', a: 'Son ödeme tarihinden sonraki ilk günden itibaren gecikme faizi işlemeye başlar.' },
          { q: 'Asgari ödeme yapılırsa gecikme faizi uygulanır mı?', a: 'Asgari ödeme yapıldığında gecikme faizi uygulanmaz ancak kalan borç üzerinden akdi faiz uygulanır.' },
        ]}
      />
    </>
  );
}
