'use client';

import { CreditCalc } from './_shared/CreditCalc';
import { ToolInfo } from './_shared/ToolInfo';

export function IsYeriKredisi() {
  return (
    <>
      <CreditCalc
        bsmv={0.05}
        kkdf={0}
        maxTerm={120}
        title="İş Yeri Kredisi Hesaplama"
        description="İş yeri kredisi taksit ve toplam geri ödeme tutarını hesaplayın. Ticari kredi olduğundan KKDF uygulanmaz, sadece BSMV %5 alınır."
      />
      <ToolInfo
        title="İş Yeri Kredisi Nedir?"
        description="İş yeri kredisi, ticari gayrimenkul alımı veya iş yeri açma/geliştirme amacıyla kullanılan ticari kredi türüdür. Bireysel tüketici kredilerinden farklı olarak KKDF kesintisi yapılmaz."
        faqs={[
          { q: 'KKDF neden uygulanmıyor?', a: 'Ticari kredilerde KKDF oranı %0 olarak belirlenmiştir. KKDF sadece tüketici kredilerine uygulanır.' },
          { q: 'İş yeri kredisi kimler kullanabilir?', a: 'Ticari faaliyet gösteren gerçek ve tüzel kişiler iş yeri kredisi kullanabilir.' },
        ]}
      />
    </>
  );
}
