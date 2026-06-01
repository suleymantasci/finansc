'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { annuityPayment, fmtTL } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';

const TYPES = [
  { value: 'ihtiyac', label: 'İhtiyaç Kredisi', bsmv: 0.05, kkdf: 0.15 },
  { value: 'konut', label: 'Konut Kredisi', bsmv: 0, kkdf: 0 },
  { value: 'tasit', label: 'Taşıt Kredisi', bsmv: 0.05, kkdf: 0.15 },
];

const schema = z.object({
  type: z.string(),
  amount: z.coerce.number().min(1, 'Tutar giriniz'),
  rate: z.coerce.number().min(0.01, 'Faiz oranı giriniz'),
  term: z.coerce.number().min(1, 'Vade giriniz'),
  paidMonths: z.coerce.number().min(0, 'Ödenen taksit sayısı giriniz'),
  delayDays: z.coerce.number().min(1, 'Gecikme süresi giriniz').max(365),
});
type FormData = z.infer<typeof schema>;

export function KrediGecikmeFaizi() {
  const [result, setResult] = useState<{ installment: number; delayInterest: number; delayBsmv: number; delayKkdf: number; total: number } | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: { type: 'ihtiyac' },
  });

  const onSubmit = (data: FormData) => {
    const t = TYPES.find(t => t.value === data.type) || TYPES[0];
    const r = data.rate / 100;
    const monthly = annuityPayment(data.amount, r, data.term);
    // Remaining balance after paid months
    let balance = data.amount;
    for (let i = 0; i < data.paidMonths; i++) {
      balance -= (monthly - balance * r);
    }
    balance = Math.max(0, balance);
    const currentInterest = balance * r;
    const currentPrincipal = monthly - currentInterest;
    // Delay interest rate = credit rate * 1.30
    const delayRate = r * 1.30;
    const dailyDelay = (monthly * delayRate) / 30;
    const delayInterest = dailyDelay * data.delayDays;
    const delayBsmv = delayInterest * t.bsmv;
    const delayKkdf = delayInterest * t.kkdf;
    const total = monthly + delayInterest + delayBsmv + delayKkdf + currentInterest * t.bsmv + currentInterest * t.kkdf;

    setResult({ installment: monthly, delayInterest, delayBsmv, delayKkdf, total });
  };

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">Kredi taksitinizi geç ödemeniz durumunda oluşacak gecikme faizini hesaplayın. Gecikme faiz oranı, kredi faiz oranının 1,30 katıdır.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select label="Kredi Türü" options={TYPES.map(t => ({ value: t.value, label: t.label }))} {...register('type')} />
        <Input label="Kredi Tutarı (₺)" type="number" step="0.01" placeholder="Örn. 100000" {...register('amount')} error={errors.amount?.message} />
        <Input label="Vade (Ay)" type="number" {...register('term')} error={errors.term?.message} />
        <Input label="Aylık Faiz Oranı (%)" type="number" step="0.01" {...register('rate')} error={errors.rate?.message} />
        <Input label="Ödenen Taksit Sayısı" type="number" {...register('paidMonths')} error={errors.paidMonths?.message} />
        <Input label="Gecikme Süresi (Gün)" type="number" placeholder="Örn. 15" {...register('delayDays')} error={errors.delayDays?.message} />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Hesapla</Button>
          <Button type="button" variant="outline" onClick={() => { reset(); setResult(null); }}>Sıfırla</Button>
        </div>
      </form>

      {result && (
        <ResultCard>
          <ResultRow label="Aylık Taksit" value={fmtTL(result.installment)} />
          <ResultRow label="Gecikme Faizi" value={fmtTL(result.delayInterest)} highlight />
          <ResultRow label="Gecikme BSMV" value={fmtTL(result.delayBsmv)} />
          <ResultRow label="Gecikme KKDF" value={fmtTL(result.delayKkdf)} />
          <ResultRow label="Toplam Ödenecek" value={fmtTL(result.total)} />
        </ResultCard>
      )}

      <ToolInfo
        title="Kredi Gecikme Faizi Nedir?"
        description="Kredi taksitlerinin zamanında ödenmemesi durumunda uygulanan ek faizdir. Gecikme faiz oranı, kredi faiz oranının 1,30 katı olarak hesaplanır. Gecikme süresince her gün için faiz işler ve üzerine BSMV ile KKDF eklenir."
        faqs={[
          { q: 'Gecikme faizi nasıl hesaplanır?', a: 'Gecikme faizi = Taksit tutarı × (kredi faiz oranı × 1.30) / 30 × gecikme gün sayısı formülüyle hesaplanır.' },
          { q: 'Gecikme faizi kredi notunu etkiler mi?', a: 'Evet, taksit gecikmesi kredi notunuzu (findeks puanınızı) olumsuz etkiler.' },
        ]}
      />
    </>
  );
}
