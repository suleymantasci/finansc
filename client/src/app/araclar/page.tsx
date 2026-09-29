import { API_URL } from '@/lib/constants';
import { safeJsonLd } from '@/lib/json-ld';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Calculator } from 'lucide-react';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { SectionIntro } from '@/components/shared/SectionIntro';
import { TOOL_CATALOG, TOOL_GROUPS } from '@/lib/tools/catalog';
import { TOOL_ICONS } from '@/lib/tools/icons';

const TOTAL = TOOL_CATALOG.length;

export const metadata: Metadata = {
  title: 'Hesaplama Araçları | Kredi, Maaş, Kıdem, Vergi, Emeklilik',
  description: `Kıdem tazminatı, maaş, kredi, KDV, gelir vergisi, emeklilik, işsizlik maaşı, faiz ve yüzde hesaplamaları için ${TOTAL} ücretsiz araç. Sonuçları link ile paylaşın.`,
  keywords: ['hesaplama araçları', 'kıdem tazminatı hesaplama', 'maaş hesaplama', 'kredi hesaplama', 'kdv hesaplama', 'emeklilik hesaplama', 'faiz hesaplama', 'yüzde hesaplama'],
  alternates: { canonical: 'https://finanscozum.net/araclar' },
};

export default async function AraclarPage() {
  // Veritabanı yalnızca admin panelinden kapatılan araçları gizlemek için kullanılır;
  // listede olmayan (yeni eklenen) araçlar varsayılan olarak görünür.
  let inactive = new Set<string>();
  try {
    const res = await fetch(`${API_URL}/api/tools`, { next: { revalidate: 60 } });
    if (res.ok) {
      const tools: { slug: string; isActive: boolean }[] = await res.json();
      inactive = new Set(tools.filter((t) => !t.isActive).map((t) => t.slug));
    }
  } catch { /* API erişilemezse hepsini göster */ }

  const groups = TOOL_GROUPS
    .map((g) => ({ ...g, tools: TOOL_CATALOG.filter((t) => t.group === g.id && !inactive.has(t.slug)) }))
    .filter((g) => g.tools.length > 0);
  const total = groups.reduce((n, g) => n + g.tools.length, 0);

  // CollectionPage + ItemList: her araç SoftwareApplication olarak işaretlenir
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Hesaplama Araçları',
    description: 'Türkiye\'nin kapsamlı finansal hesaplama araçları koleksiyonu: maaş, kıdem, kredi, vergi, emeklilik, mevduat, döviz, altın.',
    url: 'https://finanscozum.net/araclar',
    inLanguage: 'tr-TR',
    publisher: { '@id': 'https://finanscozum.net/#organization' },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: total,
      itemListElement: groups.flatMap((g) => g.tools).map((tool, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'SoftwareApplication',
          name: tool.short,
          description: tool.card,
          url: `https://finanscozum.net/araclar/${tool.slug}`,
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' },
          inLanguage: 'tr-TR',
        },
      })),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListJsonLd) }} />
      <div className="mx-auto max-w-[1440px] px-4 py-6 pb-24 lg:px-8 md:pb-12">
        <Breadcrumb items={[{ label: 'Ana Sayfa', href: '/' }, { label: 'Hesaplama araçları' }]} />
        <SectionIntro
          as="page"
          eyebrow={`${total} ücretsiz araç`}
          title="Hesaplama araçları"
          description="Maaş, kıdem tazminatı, kredi, vergi, emeklilik, faiz ve yüzde hesaplamaları. Üyelik gerekmez; sonucu tek tıkla WhatsApp veya sosyal medyada paylaşabilirsiniz. Aradığınız aracı bulmak için Ctrl+K ile arayın."
        />

        <nav aria-label="Araç kategorileri" className="mb-10 flex flex-wrap gap-2">
          {groups.map((g) => (
            <a key={g.id} href={`#${g.id}`} className="inline-flex h-9 items-center rounded-full border border-border px-4 text-[13px] text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground">
              {g.title}
              <span className="num ml-2 text-[11px] text-muted-foreground">{g.tools.length}</span>
            </a>
          ))}
        </nav>

        <div className="space-y-14">
          {groups.map((g) => (
            <section key={g.id} id={g.id} aria-labelledby={`${g.id}-t`} className="scroll-mt-32">
              <h2 id={`${g.id}-t`} className="font-display mb-5 text-3xl text-foreground">{g.title}</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {g.tools.map((tool) => {
                  const Icon = TOOL_ICONS[tool.icon] ?? Calculator;
                  return (
                    <Link key={tool.slug} href={`/araclar/${tool.slug}`} className="atlas-card atlas-card-link group flex items-start gap-4 p-4 sm:p-5">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-elevated text-primary" aria-hidden="true">
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[15px] font-medium text-foreground group-hover:text-primary">{tool.short}</span>
                        <span className="mt-0.5 block text-[13px] leading-snug text-muted-foreground">{tool.card}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
