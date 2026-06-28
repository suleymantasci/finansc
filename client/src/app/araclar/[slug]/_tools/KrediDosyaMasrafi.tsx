'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { fmtTL } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';
import { ShareButton } from '@/components/shared/ShareButton';

const schema = z.object({
  amount: z.coerce.number().min(1, 'Tutar giriniz'),
});
type FormData = z.infer<typeof schema>;
const defaults: FormData = { amount: 0 };

function readFormFromUrl(): FormData {
  if (typeof window === 'undefined') return defaults;
  const sp = new URLSearchParams(window.location.search);
  const v = sp.get('amount');
  if (v === null || v === '') return defaults;
  const n = Number(v);
  return { amount: Number.isFinite(n) ? n : 0 };
}

function writeFormToUrl(form: FormData) {
  if (typeof window === 'undefined') return;
  const sp = new URLSearchParams(window.location.search);
  if (form.amount === 0) sp.delete('amount');
  else sp.set('amount', String(form.amount));
  const qs = sp.toString();
  window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
}

export function KrediDosyaMasrafi() {
  const initialForm = readFormFromUrl();
  const [result, setResult] = useState<number | null>(initialForm.amount > 0 ? initialForm.amount * 0.005 : null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: initialForm });

  const onSubmit = (data: FormData) => {
    setResult(data.amount * 0.005);
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
      <p className="text-sm text-muted-foreground mb-4">Kredi dosya masrafı (binde 5) tutarını hesaplayın.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Kredi Tutarı (₺)" type="number" step="0.01" placeholder="Örn. 100000" {...register('amount')} error={errors.amount?.message} />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Hesapla</Button>
          <Button type="button" variant="outline" onClick={handleReset}>Sıfırla</Button>
        </div>
      </form>

      {result !== null && (
        <>
          <div className="flex items-center justify-between gap-2 mt-6 flex-wrap">
            <p className="text-sm text-muted-foreground">Sonucu paylaş — link'i kopyalayıp gönderebilirsiniz.</p>
            <ShareButton shareUrl={shareUrl} />
          </div>
          <ResultCard>
            <ResultRow label="Dosya Masrafı (Binde 5)" value={fmtTL(result)} />
          </ResultCard>
        </>
      )}

      <ToolInfo
        title="Kredi Dosya Masrafı Nedir?"
        description="Kredi dosya masrafı, bankaların kredi kullandırma sürecinde tahsil ettiği ücrettir. BDDK düzenlemeleri gereğince dosya masrafı kredi tutarının binde 5'ini geçemez."
        faqs={[
          { q: 'Dosya masrafı zorunlu mu?', a: 'Bankalar dosya masrafı talep edebilir ancak yasal üst sınır kredi tutarının binde 5\'idir.' },
          { q: 'Dosya masrafı iade alınabilir mi?', a: 'Bazı durumlarda tüketici hakem heyeti kararıyla iade alınabilir.' },
        ]}
      />
    </>
  );
}
