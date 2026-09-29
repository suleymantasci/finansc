'use client';
import { isToolHydrated } from './_shared/hydration';

import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { fmtTL, fmtNum } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';
import { ShareButton } from '@/components/shared/ShareButton';

const schema = z.object({
  count: z.coerce.number().min(2, 'En az 2 ödeme giriniz').max(50),
});
type FormData = z.infer<typeof schema>;
const defaults: FormData = { count: 2 };

function readFormFromUrl(): { count: number; payments: { days: number; amount: number }[] } {
  if (typeof window === 'undefined' || !isToolHydrated()) return { count: 2, payments: [{ days: 0, amount: 0 }, { days: 0, amount: 0 }] };
  const sp = new URLSearchParams(window.location.search);
  const countStr = sp.get('count');
  const count = countStr === null ? 2 : Math.min(Math.max(2, Number(countStr) || 2), 50);
  const dStr = sp.get('d') ?? '';
  const aStr = sp.get('a') ?? '';
  const dArr = dStr ? dStr.split(',').map(v => Number(v) || 0) : [0, 0];
  const aArr = aStr ? aStr.split(',').map(v => Number(v) || 0) : [0, 0];
  const payments: { days: number; amount: number }[] = [];
  for (let i = 0; i < count; i++) {
    payments.push({ days: dArr[i] ?? 0, amount: aArr[i] ?? 0 });
  }
  return { count, payments };
}

function writeFormToUrl(count: number, payments: { days: number; amount: number }[]) {
  if (typeof window === 'undefined') return;
  const sp = new URLSearchParams(window.location.search);
  if (count === 2) sp.delete('count');
  else sp.set('count', String(count));
  sp.delete('d'); sp.delete('a');
  const hasAny = payments.some(p => p.days !== 0 || p.amount !== 0);
  if (hasAny) {
    const dTrim = trimTrailing(payments.map(p => p.days));
    const aTrim = trimTrailing(payments.map(p => p.amount));
    sp.set('d', dTrim.join(','));
    sp.set('a', aTrim.join(','));
  }
  const qs = sp.toString();
  window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
}

function trimTrailing(arr: number[]): number[] {
  let last = arr.length - 1;
  while (last > 0 && arr[last] === 0) last--;
  return arr.slice(0, last + 1);
}

export function OrtalamaVade() {
  return (
    <Suspense fallback={null}>
      <OrtalamaVadeInner />
    </Suspense>
  );
}

function OrtalamaVadeInner() {
  const initial = readFormFromUrl();
  const [payments, setPayments] = useState<{ days: number; amount: number }[]>(initial.payments);
  const [result, setResult] = useState<{ avgDays: number; totalAmount: number } | null>(() => {
    const totalAmount = initial.payments.reduce((s, p) => s + p.amount, 0);
    if (totalAmount === 0) return null;
    const weightedSum = initial.payments.reduce((s, p) => s + p.days * p.amount, 0);
    return { avgDays: weightedSum / totalAmount, totalAmount };
  });
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: { count: initial.count },
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
    writeFormToUrl(count || 2, items);
  };

  const handleReset = () => {
    reset();
    setResult(null);
    setPayments([{ days: 0, amount: 0 }, { days: 0, amount: 0 }]);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}${window.location.search}`
    : '';

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
                className="flex h-8 w-24 min-w-0 shrink rounded-md border border-border bg-background px-2 text-sm"
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
                className="flex h-8 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-sm"
              />
            </div>
          ))}
        </div>

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
            <ResultRow label="Ortalama Vade" value={`${fmtNum(result.avgDays, 1)} gün`} highlight />
            <ResultRow label="Toplam Tutar" value={fmtTL(result.totalAmount)} />
          </ResultCard>
        </>
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
