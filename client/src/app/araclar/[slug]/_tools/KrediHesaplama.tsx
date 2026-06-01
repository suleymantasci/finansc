'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { amortizationSchedule, fmtTL, fmtPct } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';

const TYPES = [
  { value: 'ihtiyac', label: 'İhtiyaç Kredisi', bsmv: 0.15, kkdf: 0.15 },
  { value: 'konut', label: 'Konut Kredisi', bsmv: 0, kkdf: 0 },
  { value: 'tasit', label: 'Taşıt Kredisi', bsmv: 0.15, kkdf: 0.15 },
];

const schema = z.object({
  type: z.string(),
  amount: z.coerce.number().min(1, 'Tutar giriniz'),
  rate: z.coerce.number().min(0.01, 'Faiz oranı giriniz'),
  term: z.coerce.number().min(1, 'Vade giriniz').max(360, 'Maks 360 ay'),
});
type FormData = z.infer<typeof schema>;

export function KrediHesaplama() {
  const [result, setResult] = useState<{ monthly: number; total: number; interest: number; totalBsmv: number; totalKkdf: number; bsmv: number; kkdf: number } | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'ihtiyac' },
  });

  const onSubmit = (data: FormData) => {
    const t = TYPES.find(t => t.value === data.type) || TYPES[0];
    const rows = amortizationSchedule(data.amount, data.rate, data.term, t.bsmv, t.kkdf);
    const total = rows.reduce((s, r) => s + r.totalPayment, 0);
    const totalBsmv = rows.reduce((s, r) => s + r.bsmv, 0);
    const totalKkdf = rows.reduce((s, r) => s + r.kkdf, 0);
    const totalInterest = rows.reduce((s, r) => s + r.interest, 0);
    setResult({ monthly: rows[0].totalPayment, total, interest: totalInterest, totalBsmv, totalKkdf, bsmv: t.bsmv, kkdf: t.kkdf });
  };

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">Kredi türünü seçerek taksit tutarını ve toplam geri ödeme tutarını hesaplayın.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select label="Kredi Türü" options={TYPES.map(t => ({ value: t.value, label: t.label }))} {...register('type')} />
        <Input label="Kredi Tutarı (₺)" type="number" step="0.01" placeholder="Örn. 100000" {...register('amount')} error={errors.amount?.message} />
        <Input label="Vade (Ay)" type="number" placeholder="Örn. 36" {...register('term')} error={errors.term?.message} />
        <Input label="Aylık Faiz Oranı (%)" type="number" step="0.01" placeholder="Örn. 3.49" {...register('rate')} error={errors.rate?.message} />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Hesapla</Button>
          <Button type="button" variant="outline" onClick={() => { reset(); setResult(null); }}>Sıfırla</Button>
        </div>
      </form>

      {result && (
        <ResultCard>
          <ResultRow label="Aylık Taksit" value={fmtTL(result.monthly)} />
          <ResultRow label="Toplam Geri Ödeme" value={fmtTL(result.total)} />
          <ResultRow label="Toplam Faiz" value={fmtTL(result.interest)} highlight />
          {result.bsmv > 0 && <ResultRow label={`BSMV (${fmtPct(result.bsmv * 100)})`} value={fmtTL(result.totalBsmv)} />}
          {result.kkdf > 0 && <ResultRow label={`KKDF (${fmtPct(result.kkdf * 100)})`} value={fmtTL(result.totalKkdf)} />}
        </ResultCard>
      )}

      <ToolInfo
        title="Kredi Hesaplama Nedir?"
        description="Kredi hesaplama aracı ile ihtiyaç, konut ve taşıt kredisi taksit tutarlarını karşılaştırmalı olarak hesaplayabilirsiniz. Her kredi türüne göre BSMV ve KKDF oranları otomatik uygulanır."
        faqs={[
          { q: 'BSMV ve KKDF oranları nedir?', a: 'İhtiyaç ve taşıt kredilerinde BSMV %15, KKDF %15 uygulanır. Konut kredilerinde her ikisi de %0\'dır (ilk konut alımında).' },
          { q: 'Hangi kredi türü daha avantajlıdır?', a: 'Konut kredileri BSMV ve KKDF muafiyeti sayesinde genellikle en düşük maliyetli kredi türüdür.' },
        ]}
      />
    </>
  );
}
