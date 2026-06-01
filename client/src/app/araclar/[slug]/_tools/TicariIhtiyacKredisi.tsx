'use client';

import { CreditCalc } from './_shared/CreditCalc';
import { ToolInfo } from './_shared/ToolInfo';

export function TicariIhtiyacKredisi() {
  return (
    <>
      <CreditCalc bsmv={0.05} kkdf={0} maxTerm={120} title="Ticari İhtiyaç Kredisi Hesaplama" description="Ticari ihtiyaç kredisi taksit ve toplam geri ödeme tutarını hesaplayın. Ticari kredilerde KKDF uygulanmaz, sadece BSMV %5 alınır." />
      <ToolInfo title="Ticari İhtiyaç Kredisi Nedir?" description="Ticari ihtiyaç kredisi, işletmelerin işletme sermayesi, hammadde alımı, iş geliştirme gibi ihtiyaçlarını karşılamak amacıyla kullandıkları kredi türüdür." faqs={[
        { q: 'Ticari ihtiyaç kredisi ile bireysel ihtiyaç kredisi farkı nedir?', a: 'Ticari ihtiyaç kredisinde KKDF alınmaz (%0). Bireysel ihtiyaç kredisinde ise KKDF %15 uygulanır.' },
        { q: 'Kimler ticari ihtiyaç kredisi kullanabilir?', a: 'Ticari faaliyet gösteren gerçek ve tüzel kişiler kullanabilir.' },
      ]} />
    </>
  );
}
