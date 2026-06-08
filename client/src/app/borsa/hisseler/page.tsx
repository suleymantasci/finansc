// ── /borsa/hisseler — legacy URL, /borsa?tab=hisseler adresine 308 redirect ──
//
// Artık hisse listeleme tek sayfa: /borsa (MainTab='hisseler' | 'endeksler').
// Bu sayfa sadece 301/308 redirect ile juice taşır. Hisse detay sayfaları
// (/borsa/hisseler/[sembol]) bundan etkilenmez, ayrı route olarak çalışır.
//
// 308 (Permanent) seçildi: 301'den farkı olarak method/body korunur (SEO
// dostu, Google juice tamamen hedef sayfaya aktarılır).

import { permanentRedirect } from 'next/navigation';

export default function HisselerIndexPage() {
  permanentRedirect('/borsa?tab=hisseler');
}
