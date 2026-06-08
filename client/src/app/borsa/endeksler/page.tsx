// ── /borsa/endeksler — legacy URL, /borsa?tab=endeksler adresine 308 redirect ──
//
// /borsa/hisseler ile aynı strateji. Endeks detay sayfaları
// (/borsa/endeksler/[sembol]) etkilenmez, ayrı route olarak çalışır.

import { permanentRedirect } from 'next/navigation';

export default function EndekslerIndexPage() {
  permanentRedirect('/borsa?tab=endeksler');
}
