'use client';
import { isToolHydrated } from './_shared/hydration';

import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { annuityPayment, fmtTL } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';
import { ShareButton } from '@/components/shared/ShareButton';

const schema = z.object({
  amount: z.coerce.number().min(1, 'Tutar giriniz'),
  term: z.coerce.number().min(2, 'Vade giriniz').max(12, 'Maks 12 ay'),
  rate: z.coerce.number().min(0.01, 'Faiz oranı giriniz'),
});
type FormData = z.infer<typeof schema>;
type CalcResult = { monthly: number; totalInterest: number; bsmv: number; kkdf: number; total: number };
const defaults: FormData = { amount: 0, term: 0, rate: 4.25 };

function readFormFromUrl(): FormData {
  if (typeof window === 'undefined' || !isToolHydrated()) return defaults;
  const sp = new URLSearchParams(window.location.search);
  const num = (k: keyof FormData): number => {
    const v = sp.get(k as string);
    if (v === null || v === '') return defaults[k] as number;
    const n = Number(v);
    return Number.isFinite(n) ? n : (defaults[k] as number);
  };
  return { amount: num('amount'), term: num('term'), rate: num('rate') };
}

function writeFormToUrl(form: FormData) {
  if (typeof window === 'undefined') return;
  const sp = new URLSearchParams(window.location.search);
  for (const k of ['amount', 'term', 'rate'] as (keyof FormData)[]) {
    const v = form[k];
    const def = defaults[k];
    if (v === def || (typeof v === 'number' && v === 0)) sp.delete(k as string);
    else sp.set(k as string, String(v));
  }
  const qs = sp.toString();
  window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
}

function compute(data: FormData): CalcResult {
  const r = data.rate / 100;
  const monthly = annuityPayment(data.amount, r, data.term);
  const totalPayment = monthly * data.term;
  const totalInterest = totalPayment - data.amount;
  const bsmv = totalInterest * 0.15;
  const kkdf = totalInterest * 0.15;
  const monthlyWithTax = monthly + (bsmv + kkdf) / data.term;
  return { monthly: monthlyWithTax, totalInterest, bsmv, kkdf, total: totalPayment + bsmv + kkdf };
}

export function KrediKartiNakitAvans() {
  return (
    <Suspense fallback={null}>
      <KrediKartiNakitAvansInner />
    </Suspense>
  );
}

function KrediKartiNakitAvansInner() {
  const initialForm = readFormFromUrl();
  const [result, setResult] = useState<CalcResult | null>(
    initialForm.amount > 0 && initialForm.term > 0 && initialForm.rate > 0 ? compute(initialForm) : null,
  );
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: initialForm,
  });

  const onSubmit = (data: FormData) => {
    setResult(compute(data));
    writeFormToUrl(data);
  };

  const handleReset = () => {
    reset();
    setResult(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}${window.location.search}`
    : '';

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">Kredi kartından çektiğiniz taksitli nakit avansın aylık ödeme ve toplam maliyetini hesaplayın.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Avans Tutarı (₺)" type="number" step="0.01" placeholder="Örn. 5000" {...register('amount')} error={errors.amount?.message} />
        <Input label="Vade (Ay, maks 12)" type="number" placeholder="Örn. 6" {...register('term')} error={errors.term?.message} />
        <Input label="Aylık Faiz Oranı (%)" type="number" step="0.01" defaultValue="4.25" {...register('rate')} error={errors.rate?.message} />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Hesapla</Button>
          <Button type="button" variant="outline" onClick={handleReset}>Sıfırla</Button>
        </div>
      </form>

      {result && (
        <>
          <div className="flex items-center justify-between gap-2 mt-6 flex-wrap">
            <p className="text-sm text-muted-foreground">Sonucu paylaş — link'i kopyalayıp gönderebilirsiniz.</p>
            <ShareButton shareUrl={shareUrl} />
          </div>
          <ResultCard>
            <ResultRow label="Aylık Taksit" value={fmtTL(result.monthly)} />
            <ResultRow label="Toplam Faiz" value={fmtTL(result.totalInterest)} highlight />
            <ResultRow label="BSMV (%15)" value={fmtTL(result.bsmv)} />
            <ResultRow label="KKDF (%15)" value={fmtTL(result.kkdf)} />
            <ResultRow label="Toplam Ödeme" value={fmtTL(result.total)} />
          </ResultCard>
        </>
      )}

      <ToolInfo
        title="Taksitli Nakit Avans Nedir?"
        description="Kredi kartından nakit para çekme işleminin taksitlendirilmiş halidir. Normal nakit avansa göre faiz oranı genellikle daha yüksektir. Faiz üzerinden BSMV %15 ve KKDF %15 uygulanır."
        faqs={[
          { q: 'Nakit avans faiz oranı alışverişten farklı mı?', a: 'Evet, nakit avans faiz oranı genellikle alışveriş faiz oranından daha yüksektir.' },
          { q: 'Nakit avans limiti nedir?', a: 'Nakit avans limiti kart limitinizin belirli bir yüzdesidir ve banka tarafından belirlenir.' },
        ]}
      />
    </>
  );
}
