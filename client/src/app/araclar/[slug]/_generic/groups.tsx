'use client';

// Her grup ayrı JS parçası: bir araç sayfası yalnızca kendi grubunun tanımlarını indirir.
// ssr açık — form ve örnek sonuç sunucu HTML'inde de çizilir (SEO).

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { SpecModule } from '@/lib/tools/specs/modules';

type Props = { slug: string; title: string; today: string };

export const GROUP_COMPONENTS: Record<SpecModule, ComponentType<Props>> = {
  'maas': dynamic(() => import('./group-maas')),
  'emeklilik': dynamic(() => import('./group-emeklilik')),
  'vergi': dynamic(() => import('./group-vergi')),
  'kredi': dynamic(() => import('./group-kredi')),
  'kredi-faiz': dynamic(() => import('./group-kredi-faiz')),
  'faiz-enflasyon': dynamic(() => import('./group-faiz-enflasyon')),
  'yatirim-emlak': dynamic(() => import('./group-yatirim-emlak')),
  'piyasa': dynamic(() => import('./group-piyasa')),
  'ticaret-gunluk': dynamic(() => import('./group-ticaret-gunluk')),
};
