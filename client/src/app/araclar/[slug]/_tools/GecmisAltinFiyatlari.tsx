'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { fmtTL, fmtNum } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';

const GOLD_TYPES = [
  { value: 'gram24', label: 'Gram Altın (24 Ayar)', gram: 1, ayar: 24 },
  { value: 'gram22', label: 'Gram Altın (22 Ayar)', gram: 1, ayar: 22 },
  { value: 'gram18', label: 'Gram Altın (18 Ayar)', gram: 1, ayar: 18 },
  { value: 'gram14', label: 'Gram Altın (14 Ayar)', gram: 1, ayar: 14 },
  { value: 'ons', label: 'Ons Altın', gram: 31.1034768, ayar: 24 },
  { value: 'ceyrek', label: 'Çeyrek Altın', gram: 1.754, ayar: 22 },
  { value: 'yarim', label: 'Yarım Altın', gram: 3.50, ayar: 22 },
  { value: 'tam', label: 'Tam/Ziynet Altın', gram: 7.00, ayar: 22 },
  { value: 'cumhuriyet', label: 'Cumhuriyet Altını', gram: 7.20, ayar: 22 },
];

const schema = z.object({
  direction: z.string(),
  goldType: z.string(),
  amount: z.coerce.number().min(0.01, 'Miktar giriniz'),
  gramPrice: z.coerce.number().min(0.01, 'O tarihte gram fiyatını giriniz'),
});
type FormData = z.infer<typeof schema>;

export function GecmisAltinFiyatlari() {
  const [result, setResult] = useState<{ value: number; label: string } | null>(null);
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: { direction: 'toMoney', goldType: 'gram24' },
  });

  const direction = watch('direction');

  const onSubmit = (data: FormData) => {
    const type = GOLD_TYPES.find(t => t.value === data.goldType) || GOLD_TYPES[0];
    const pureGram = type.gram * (type.ayar / 24);
    if (data.direction === 'toMoney') {
      const value = data.amount * pureGram * data.gramPrice;
      setResult({ value, label: 'Parasal Değeri' });
    } else {
      const value = data.amount / (pureGram * data.gramPrice);
      setResult({ value, label: `${type.label} Miktarı` });
    }
  };

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">Geçmiş bir tarihteki altın fiyatı ile hesaplama yapın. O tarihteki gram altın fiyatını girerek değer hesaplayabilirsiniz.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select label="İşlem Türü" options={[
          { value: 'toMoney', label: 'Altından Paraya' },
          { value: 'toGold', label: 'Paradan Altına' },
        ]} {...register('direction')} />
        <Select label="Altın Türü" options={GOLD_TYPES.map(t => ({ value: t.value, label: t.label }))} {...register('goldType')} />
        <Input label="O Tarihteki Gram Fiyatı (₺)" type="number" step="0.01" placeholder="Geçmiş tarihte gram altın fiyatı" {...register('gramPrice')} error={errors.gramPrice?.message} />
        <Input
          label={direction === 'toMoney' ? 'Miktar (gram/ons/adet)' : 'Tutar (₺)'}
          type="number" step="0.01" placeholder="Örn. 10"
          {...register('amount')} error={errors.amount?.message}
        />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Hesapla</Button>
          <Button type="button" variant="outline" onClick={() => { reset(); setResult(null); }}>Sıfırla</Button>
        </div>
      </form>

      {result && (
        <ResultCard>
          <ResultRow label={result.label} value={result.label.includes('Miktarı') ? fmtNum(result.value, 4) : fmtTL(result.value)} />
        </ResultCard>
      )}

      <ToolInfo
        title="Geçmiş Altın Fiyatları Nedir?"
        description="Geçmiş altın fiyatları hesaplama aracı ile eski tarihlerdeki altın fiyatlarıyla hesaplama yapabilirsiniz. Hesaplama yapabilmek için o tarihte geçerli olan gram altın fiyatını giriniz."
        faqs={[
          { q: 'Geçmiş altın fiyatlarını nereden bulabilirim?', a: 'TÜİK, TCMB ve çeşitli finans sitelerinden eski tarihlere ait altın fiyatlarına ulaşabilirsiniz.' },
        ]}
      />
    </>
  );
}
