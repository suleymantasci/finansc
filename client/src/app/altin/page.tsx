import type { Metadata } from 'next';
import { AltinClient } from './AltinClient';

export const metadata: Metadata = {
  title: 'Altın Fiyatları',
  description: "Türkiye'deki tüm altın fiyatlarını anlık olarak karşılaştırın. Gram, çeyrek, yarım, tam altın ve bilezik fiyatları canlı olarak güncellenir.",
  keywords: ['altın fiyatları', 'gram altın', 'çeyrek altın', 'canlı altın', 'altın fiyatları bugün'],
};

export default function AltinPage() {
  return <AltinClient />;
}
