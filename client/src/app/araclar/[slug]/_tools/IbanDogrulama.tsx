'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { validateIBAN } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';

const TR_BANKS: Record<string, string> = {
  '0001': 'T.C. Merkez Bankası', '0004': 'İller Bankası', '0010': 'Ziraat Bankası',
  '0012': 'Halkbank', '0014': 'İş Bankası (İşbank)', '0015': 'Vakıflar Bankası',
  '0017': 'Kuveyt Türk', '0032': 'Türk Ekonomi Bankası (TEB)', '0046': 'Akbank',
  '0059': 'Şekerbank', '0062': 'Garanti BBVA', '0064': 'İş Bankası',
  '0067': 'Yapı ve Kredi Bankası', '0091': 'Arap Türk Bankası', '0096': 'Turkish Bank',
  '0099': 'ING Bank', '0100': 'Adabank', '0103': 'Fibabanka', '0108': 'Türkiye Finans',
  '0109': 'HSBC', '0111': 'QNB Finansbank', '0115': 'Deutsche Bank',
  '0121': 'Odeabank', '0123': 'ICBC Turkey Bank', '0124': 'Alternatifbank',
  '0125': 'Burgan Bank', '0134': 'Denizbank', '0135': 'Anadolubank',
  '0137': 'Emlak Katılım', '0142': 'Bankpozitif', '0143': 'Aktif Yatırım Bankası',
  '0146': 'Enpara (QNB Finansbank)', '0148': 'Hayat Finans', '0203': 'Albaraka Türk',
  '0206': 'Vakıf Katılım', '0210': 'Ziraat Katılım',
};

const schema = z.object({
  iban: z.string().min(1, 'IBAN giriniz'),
});

export function IbanDogrulama() {
  const [result, setResult] = useState<{ valid: boolean; country: string; bank: string; formatted: string } | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<{ iban: string }>({ resolver: zodResolver(schema) });

  const onSubmit = (data: { iban: string }) => {
    const cleaned = data.iban.replace(/\s+/g, '').toUpperCase();
    const { valid, country, bankCode } = validateIBAN(cleaned);
    const bank = country === 'TR' ? (TR_BANKS[bankCode] || 'Bilinmeyen Banka') : '';
    const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
    setResult({ valid, country, bank, formatted });
  };

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">IBAN numaranızın geçerliliğini kontrol edin. Türk IBAN numaraları TR ile başlar ve 26 karakter uzunluğundadır.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="IBAN" placeholder="TR80 0006 2000 0670 0006 6844 77" {...register('iban')} error={errors.iban?.message} />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Doğrula</Button>
          <Button type="button" variant="outline" onClick={() => { reset(); setResult(null); }}>Sıfırla</Button>
        </div>
      </form>

      {result && (
        <ResultCard>
          <ResultRow label="Durum" value={result.valid ? '✅ Geçerli' : '❌ Geçersiz'} />
          <ResultRow label="Ülke" value={result.country} />
          {result.bank && <ResultRow label="Banka" value={result.bank} />}
          <ResultRow label="Formatlanmış" value={result.formatted} />
        </ResultCard>
      )}

      <ToolInfo
        title="IBAN Doğrulama Nedir?"
        description="IBAN (International Bank Account Number), uluslararası banka hesap numarası standardıdır. MOD 97 algoritması kullanılarak doğrulama yapılır. Türkiye'de IBAN 26 hanedir ve TR harfleriyle başlar."
        faqs={[
          { q: 'IBAN nasıl oluşturulur?', a: 'İlk 2 hane ülke kodu, sonraki 2 hane kontrol rakamı, geri kalanı banka ve hesap numarasıdır.' },
          { q: 'IBAN yanlışsa ne olur?', a: 'Yanlış IBAN ile yapılan transferler geri döner ve ek masraflar oluşabilir.' },
        ]}
      />
    </>
  );
}
