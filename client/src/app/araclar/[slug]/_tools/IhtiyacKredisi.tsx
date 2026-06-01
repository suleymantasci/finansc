'use client';

import { CreditCalc } from './_shared/CreditCalc';
import { ToolInfo } from './_shared/ToolInfo';

export function IhtiyacKredisi() {
  return (
    <>
      <CreditCalc
        bsmv={0.15}
        kkdf={0.15}
        maxTerm={120}
        title="İhtiyaç Kredisi Hesaplama"
        description="İhtiyaç kredisi taksit tutarını, toplam geri ödeme ve faiz tutarını hesaplayın. BSMV %15 ve KKDF %15 oranları otomatik uygulanır."
      />
      <ToolInfo
        title="İhtiyaç Kredisi Nedir?"
        description="İhtiyaç kredisi, bireysel müşterilerin çeşitli ihtiyaçlarını karşılamak amacıyla bankalardan kullandıkları tüketici kredisi türüdür. Eğitim, sağlık, tatil, beyaz eşya gibi ihtiyaçlar için kullanılabilir. Geri ödeme aylık eşit taksitler halinde yapılır."
        faqs={[
          { q: 'BSMV nedir?', a: 'Banka ve Sigorta Muameleleri Vergisi, kredi faizleri üzerinden %15 oranında alınan vergidir.' },
          { q: 'KKDF nedir?', a: 'Kaynak Kullanımını Destekleme Fonu, tüketici kredilerinin faizi üzerinden %15 oranında alınan fondur.' },
          { q: 'İhtiyaç kredisi faiz oranı neye göre belirlenir?', a: 'Faiz oranı bankanın politikası, müşterinin kredi notu, vade ve tutara göre belirlenir.' },
        ]}
      />
    </>
  );
}
