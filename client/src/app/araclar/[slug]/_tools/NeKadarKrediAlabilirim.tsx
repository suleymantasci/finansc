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
  income: z.coerce.number().min(1, 'Gelir giriniz'),
  spouseIncome: z.coerce.number().min(0),
  otherIncome: z.coerce.number().min(0),
  existingInstallment: z.coerce.number().min(0),
  term: z.coerce.number().min(1),
  rate: z.coerce.number().min(0.01),
});
type FormData = z.infer<typeof schema>;

export function NeKadarKrediAlabilirim() {
  const [result, setResult] = useState<{ maxInstallment: number; maxLoan: number; totalPayment: number } | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: { type: 'ihtiyac', spouseIncome: 0, otherIncome: 0, existingInstallment: 0 },
  });

  const onSubmit = (data: FormData) => {
    const totalIncome = data.income + data.spouseIncome + data.otherIncome;
    const maxInstallment = (totalIncome / 2) - data.existingInstallment;
    if (maxInstallment <= 0) {
      setResult({ maxInstallment: 0, maxLoan: 0, totalPayment: 0 });
      return;
    }
    const t = TYPES.find(t => t.value === data.type) || TYPES[0];
    const r = data.rate / 100;
    // Reverse annuity: P = M * ((1+r)^n - 1) / (r * (1+r)^n)
    // But monthly installment includes BSMV/KKDF
    // Effective monthly M = maxInstallment / (1 + bsmv_kkdf_ratio_on_interest)
    // Simplified: just use base formula then adjust
    const pow = Math.pow(1 + r, data.term);
    const maxLoanBase = maxInstallment * (pow - 1) / (r * pow);
    // Verify with BSMV/KKDF
    const verify = annuityPayment(maxLoanBase, r, data.term);
    const interestFirstMonth = maxLoanBase * r;
    const taxOnFirstMonth = interestFirstMonth * (t.bsmv + t.kkdf);
    const actualMonthly = verify + taxOnFirstMonth;
    // Adjust loan down to account for taxes
    const adjustedLoan = maxLoanBase * (maxInstallment / actualMonthly);

    setResult({
      maxInstallment,
      maxLoan: Math.max(0, adjustedLoan),
      totalPayment: maxInstallment * data.term,
    });
  };

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">Gelirinize göre alabileceğiniz maksimum kredi tutarını hesaplayın. Bankalar genellikle hane gelirinin yarısını taksit sınırı olarak uygular.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select label="Kredi Türü" options={TYPES.map(t => ({ value: t.value, label: t.label }))} {...register('type')} />
        <Input label="Aylık Gelir (₺)" type="number" step="0.01" placeholder="Örn. 30000" {...register('income')} error={errors.income?.message} />
        <Input label="Eşin Geliri (₺)" type="number" step="0.01" defaultValue="0" {...register('spouseIncome')} />
        <Input label="Diğer Hane Geliri (₺)" type="number" step="0.01" defaultValue="0" {...register('otherIncome')} />
        <Input label="Mevcut Kredi Taksitleri (₺)" type="number" step="0.01" defaultValue="0" {...register('existingInstallment')} />
        <Input label="Vade (Ay)" type="number" placeholder="Örn. 36" {...register('term')} error={errors.term?.message} />
        <Input label="Aylık Faiz Oranı (%)" type="number" step="0.01" placeholder="Örn. 3.49" {...register('rate')} error={errors.rate?.message} />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Hesapla</Button>
          <Button type="button" variant="outline" onClick={() => { reset(); setResult(null); }}>Sıfırla</Button>
        </div>
      </form>

      {result && (
        <ResultCard>
          <ResultRow label="Maks. Aylık Taksit" value={fmtTL(result.maxInstallment)} />
          <ResultRow label="Alabileceğiniz Kredi" value={fmtTL(result.maxLoan)} highlight />
          <ResultRow label="Toplam Geri Ödeme" value={fmtTL(result.totalPayment)} />
        </ResultCard>
      )}

      <ToolInfo
        title="Ne Kadar Kredi Alabilirim?"
        description="Bankalar kredi verirken hane halkının toplam gelirinin yarısını aşmayacak şekilde taksit tutarı belirler. Mevcut kredi taksitleriniz de bu sınırdan düşülür."
        faqs={[
          { q: 'Gelirin yarısı kuralı nedir?', a: 'Bankalar aylık taksit tutarının hane gelirinin yarısını geçmemesini şart koşar. Bu BDDK düzenlemesidir.' },
          { q: 'Eşin geliri dahil ediliyor mu?', a: 'Evet, eşin çalışması durumunda geliri hane gelirine eklenerek kredi limiti artırılabilir.' },
        ]}
      />
    </>
  );
}
