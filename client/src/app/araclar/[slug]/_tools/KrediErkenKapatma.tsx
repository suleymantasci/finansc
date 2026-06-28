'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { fmtTL, fmtPct } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';
import { ShareButton } from '@/components/shared/ShareButton';

const schema = z.object({
  remainingTerm: z.string(),
  earlyPayment: z.coerce.number().min(1, 'Tutar giriniz'),
});
type FormData = z.infer<typeof schema>;
type CalcResult = { penalty: number; rate: number };
const defaults: FormData = { remainingTerm: 'short', earlyPayment: 0 };

function readFormFromUrl(): FormData {
  if (typeof window === 'undefined') return defaults;
  const sp = new URLSearchParams(window.location.search);
  const v = sp.get('earlyPayment');
  const n = v === null || v === '' ? 0 : Number(v);
  return { remainingTerm: sp.get('remainingTerm') ?? defaults.remainingTerm, earlyPayment: Number.isFinite(n) ? n : 0 };
}

function writeFormToUrl(form: FormData) {
  if (typeof window === 'undefined') return;
  const sp = new URLSearchParams(window.location.search);
  if (form.remainingTerm === defaults.remainingTerm) sp.delete('remainingTerm');
  else sp.set('remainingTerm', form.remainingTerm);
  if (form.earlyPayment === 0) sp.delete('earlyPayment');
  else sp.set('earlyPayment', String(form.earlyPayment));
  const qs = sp.toString();
  window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
}

function compute(data: FormData): CalcResult {
  const rate = data.remainingTerm === 'short' ? 0.01 : 0.02;
  return { penalty: data.earlyPayment * rate, rate: rate * 100 };
}

export function KrediErkenKapatma() {
  const initialForm = readFormFromUrl();
  const [result, setResult] = useState<CalcResult | null>(initialForm.earlyPayment > 0 ? compute(initialForm) : null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: initialForm });

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
      <p className="text-sm text-muted-foreground mb-4">Konut kredisi erken kapatma cezasını hesaplayın. Kalan vadeye göre %1 veya %2 oranında ceza uygulanır.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          label="Kalan Kredi Vadesi"
          options={[
            { value: 'short', label: '36 ay ve altı' },
            { value: 'long', label: '36 aydan fazla' },
          ]}
          {...register('remainingTerm')}
        />
        <Input label="Erken Ödeme Tutarı (₺)" type="number" step="0.01" placeholder="Örn. 50000" {...register('earlyPayment')} error={errors.earlyPayment?.message} />
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
            <ResultRow label="Ceza Oranı" value={fmtPct(result.rate)} />
            <ResultRow label="Erken Kapatma Cezası" value={fmtTL(result.penalty)} highlight />
          </ResultCard>
        </>
      )}

      <ToolInfo
        title="Kredi Erken Kapatma Cezası Nedir?"
        description="Konut kredilerinde erken kapatma durumunda bankalar yasal olarak ceza uygulayabilir. Kalan vadesi 36 ay ve altında olan kredilerde %1, 36 ayın üzerinde olan kredilerde ise %2 oranında erken ödeme cezası alınabilir. Bu düzenleme sadece konut kredileri için geçerlidir."
        faqs={[
          { q: 'Tüketici kredilerinde erken kapatma cezası var mı?', a: 'Hayır, ihtiyaç kredileri ve taşıt kredileri cezasız erken kapatılabilir.' },
          { q: 'Erken kapatma cezası nasıl hesaplanır?', a: 'Erken ödenen tutar üzerinden kalan vadeye göre %1 veya %2 ceza uygulanır.' },
        ]}
      />
    </>
  );
}
