'use client';

import { CreditCalc } from './_shared/CreditCalc';
import { ToolInfo } from './_shared/ToolInfo';

export function TasitKredisi() {
  return (
    <>
      <CreditCalc bsmv={0.15} kkdf={0.15} maxTerm={48} title="Taşıt Kredisi Hesaplama" description="Taşıt kredisi taksit ve toplam geri ödeme tutarını hesaplayın. Taşıt kredilerinde BSMV %15 ve KKDF %15 uygulanır." />
      <ToolInfo title="Taşıt Kredisi Nedir?" description="Taşıt kredisi, sıfır veya ikinci el araç satın almak isteyen bireysel müşterilere sunulan tüketici kredisidir. Vade genellikle 48 aya kadar çıkabilir." faqs={[
        { q: 'Taşıt kredisinde maksimum vade nedir?', a: 'Taşıt kredilerinde maksimum vade genellikle 48 ay (4 yıl) olarak uygulanmaktadır.' },
        { q: 'İkinci el araç için de kredi alınabilir mi?', a: 'Evet, ikinci el araçlar için de taşıt kredisi kullanılabilir ancak aracın yaşına göre sınırlamalar olabilir.' },
      ]} />
    </>
  );
}
