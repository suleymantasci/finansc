'use client';

import { CreditCalc } from './_shared/CreditCalc';
import { ToolInfo } from './_shared/ToolInfo';

export function TicariAracKredisi() {
  return (
    <>
      <CreditCalc bsmv={0.05} kkdf={0} maxTerm={48} title="Ticari Araç Kredisi Hesaplama" description="Ticari araç kredisi taksit ve toplam geri ödeme tutarını hesaplayın. Ticari kredilerde KKDF uygulanmaz, sadece BSMV %5 alınır." />
      <ToolInfo title="Ticari Araç Kredisi Nedir?" description="Ticari araç kredisi, ticari faaliyet amacıyla kullanılacak araçların (kamyon, minibüs, kamyonet vb.) finansmanı için kullanılan kredi türüdür. Ticari kredi olduğundan KKDF uygulanmaz." faqs={[
        { q: 'Ticari araç kredisinde KKDF neden yoktur?', a: 'Ticari kredilerde KKDF oranı %0 olarak belirlenmiştir.' },
        { q: 'Bireysel müşteriler ticari araç kredisi alabilir mi?', a: 'Ticari araç kredisi genellikle ticari faaliyet gösteren kişi ve kurumlara sunulmaktadır.' },
      ]} />
    </>
  );
}
