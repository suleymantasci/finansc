'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { annuityPayment, amortizationSchedule, remainingPrincipal, fmtTL } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';

const TYPES = [
  { value: 'ihtiyac', label: 'İhtiyaç Kredisi', bsmv: 0.15, kkdf: 0.15 },
  { value: 'konut', label: 'Konut Kredisi', bsmv: 0, kkdf: 0 },
  { value: 'tasit', label: 'Taşıt Kredisi', bsmv: 0.15, kkdf: 0.15 },
];

const schema = z.object({
  type: z.string(),
  amount: z.coerce.number().min(1, 'Tutar giriniz'),
  term: z.coerce.number().min(1),
  rate: z.coerce.number().min(0.01),
  paidMonths: z.coerce.number().min(0),
  earlyPenalty: z.coerce.number().min(0).max(100),
  newTerm: z.coerce.number().min(1),
  newRate: z.coerce.number().min(0.01),
  newCost: z.coerce.number().min(0),
});
type FormData = z.infer<typeof schema>;

export function KrediYapilandirma() {
  const [result, setResult] = useState<{
    oldRemaining: number; oldMonthly: number; oldTotal: number;
    newMonthly: number; newTotal: number; savings: number;
  } | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: { type: 'ihtiyac', earlyPenalty: 0, newCost: 0 },
  });

  const onSubmit = (data: FormData) => {
    const t = TYPES.find(t => t.value === data.type) || TYPES[0];
    const r = data.rate / 100;
    const oldMonthly = annuityPayment(data.amount, r, data.term);
    const remaining = remainingPrincipal(data.amount, data.rate, data.term, data.paidMonths, t.bsmv, t.kkdf);
    const remainingMonths = data.term - data.paidMonths;
    const oldRemainingTotal = oldMonthly * remainingMonths;

    // Early closure penalty
    const penalty = remaining * (data.earlyPenalty / 100);
    const newPrincipal = remaining + penalty + data.newCost;

    const newR = data.newRate / 100;
    const newRows = amortizationSchedule(newPrincipal, data.newRate, data.newTerm, t.bsmv, t.kkdf);
    const newMonthly = newRows[0].totalPayment;
    const newTotal = newRows.reduce((s, r) => s + r.totalPayment, 0);

    // Add BSMV/KKDF to old remaining
    const oldRows = amortizationSchedule(data.amount, data.rate, data.term, t.bsmv, t.kkdf);
    const oldTotalRemaining = oldRows.slice(data.paidMonths).reduce((s, r) => s + r.totalPayment, 0);

    setResult({
      oldRemaining: remaining,
      oldMonthly: oldRows[data.paidMonths]?.totalPayment || oldMonthly,
      oldTotal: oldTotalRemaining,
      newMonthly,
      newTotal,
      savings: oldTotalRemaining - newTotal,
    });
  };

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">Mevcut kredinizi yeni bir kredi ile yapılandırdığınızda (refinansman) oluşacak farkı karşılaştırın.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <h3 className="font-semibold text-sm pt-2">Mevcut Kredi</h3>
        <Select label="Kredi Türü" options={TYPES.map(t => ({ value: t.value, label: t.label }))} {...register('type')} />
        <Input label="Kredi Tutarı (₺)" type="number" step="0.01" {...register('amount')} error={errors.amount?.message} />
        <Input label="Vade (Ay)" type="number" {...register('term')} error={errors.term?.message} />
        <Input label="Aylık Faiz Oranı (%)" type="number" step="0.01" {...register('rate')} error={errors.rate?.message} />
        <Input label="Ödenen Taksit Sayısı" type="number" {...register('paidMonths')} error={errors.paidMonths?.message} />
        <Input label="Erken Ödeme Komisyonu (%)" type="number" step="0.01" defaultValue="0" {...register('earlyPenalty')} error={errors.earlyPenalty?.message} />
        <h3 className="font-semibold text-sm pt-2">Yeni Kredi</h3>
        <Input label="Yeni Vade (Ay)" type="number" {...register('newTerm')} error={errors.newTerm?.message} />
        <Input label="Yeni Aylık Faiz Oranı (%)" type="number" step="0.01" {...register('newRate')} error={errors.newRate?.message} />
        <Input label="Toplam Masraf (₺)" type="number" step="0.01" defaultValue="0" {...register('newCost')} error={errors.newCost?.message} />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Hesapla</Button>
          <Button type="button" variant="outline" onClick={() => { reset(); setResult(null); }}>Sıfırla</Button>
        </div>
      </form>

      {result && (
        <ResultCard>
          <ResultRow label="Kalan Anapara" value={fmtTL(result.oldRemaining)} />
          <h3 className="font-semibold text-sm pt-2">Mevcut Kredi</h3>
          <ResultRow label="Aylık Taksit" value={fmtTL(result.oldMonthly)} />
          <ResultRow label="Kalan Toplam Ödeme" value={fmtTL(result.oldTotal)} />
          <h3 className="font-semibold text-sm pt-2">Yeni Kredi</h3>
          <ResultRow label="Aylık Taksit" value={fmtTL(result.newMonthly)} />
          <ResultRow label="Toplam Ödeme" value={fmtTL(result.newTotal)} />
          <div className="border-t border-border pt-2 mt-2">
            <ResultRow label={result.savings >= 0 ? 'Tasarruf' : 'Ek Maliyet'} value={fmtTL(Math.abs(result.savings))} highlight />
          </div>
        </ResultCard>
      )}

      <ToolInfo
        title="Kredi Yapılandırma (Refinansman) Nedir?"
        description="Mevcut kredinizi daha uygun koşullarla yeni bir kredi ile yeniden yapılandırma işlemidir. Faiz oranlarının düşmesi durumunda mevcut kredinizi kapatıp daha düşük faizli yeni bir kredi kullanarak tasarruf edebilirsiniz."
        faqs={[
          { q: 'Refinansman ne zaman mantıklıdır?', a: 'Mevcut faiz oranınız piyasa ortalamasının üzerindeyse ve erken kapatma maliyetleri tasarrufu aşmıyorsa mantıklıdır.' },
          { q: 'Erken kapatma cezası var mı?', a: 'Konut kredilerinde kalan vadeye göre %1-2 erken kapatma cezası olabilir. Tüketici kredilerinde ceza yoktur.' },
        ]}
      />
    </>
  );
}
