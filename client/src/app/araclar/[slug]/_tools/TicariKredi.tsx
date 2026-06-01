'use client';

import { CreditCalc } from './_shared/CreditCalc';
import { ToolInfo } from './_shared/ToolInfo';

export function TicariKredi() {
  return (
    <>
      <CreditCalc bsmv={0.05} kkdf={0} maxTerm={120} title="Ticari Kredi Hesaplama" description="Ticari kredi taksit ve toplam geri ödeme tutarını hesaplayın. Ticari kredilerde KKDF uygulanmaz, sadece BSMV %5 alınır." />
      <ToolInfo title="Ticari Kredi Nedir?" description="Ticari kredi, işletmelerin çeşitli finansman ihtiyaçlarını karşılamak amacıyla bankalardan kullandıkları kredi türüdür. Bireysel kredilerden farklı olarak KKDF uygulanmaz." faqs={[
        { q: 'Ticari kredide BSMV ve KKDF oranları nedir?', a: 'BSMV %5 uygulanır, KKDF ise %0\'dır.' },
        { q: 'Ticari kredi faiz oranları bireysel kredilerden farklı mıdır?', a: 'Evet, ticari kredi faiz oranları genellikle firma risk profiline göre bireysel ayrı belirlenir.' },
      ]} />
    </>
  );
}
