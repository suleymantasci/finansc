'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calculator, PiggyBank, TrendingDown, Banknote, Wallet } from 'lucide-react';
import { SectionIntro } from '@/components/shared/SectionIntro';

const TOOLS = [
  { slug: 'maas-hesaplama', title: 'Maaş Hesaplama', desc: 'Brütten nete, SGK, gelir vergisi hesaplama', icon: Wallet },
  { slug: 'ihtiyac-kredisi', title: 'Kredi Hesaplama', desc: 'Aylık taksit ve toplam maliyeti hesaplayın', icon: Calculator },
  { slug: 'vadeli-mevduat', title: 'Vadeli Mevduat', desc: 'Net ve brüt mevduat getirinizi hesaplayın', icon: PiggyBank },
  { slug: 'reel-getiri', title: 'Reel Getiri', desc: 'Enflasyondan arındırılmış gerçek kazancınız', icon: TrendingDown },
];

export function AraclarSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <SectionIntro
        title="Hesaplama Araçları"
        description="Finansal kararlarınızı kolaylaştıran araçlar"
        ctaLabel="Tüm araçlar"
        ctaHref="/araclar"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {TOOLS.map((tool, i) => {
          const Icon = tool.icon;
          return (
            <motion.div
              key={tool.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
            >
              <Link
                href={`/araclar/${tool.slug}`}
                className="group flex h-full flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-surface-hover lg:p-5"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold lg:text-base">{tool.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground lg:text-sm">{tool.desc}</p>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
