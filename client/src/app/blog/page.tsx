import type { Metadata } from 'next';
import { BlogListClient } from './BlogListClient';

export const metadata: Metadata = {
  title: 'Bilgi Merkezi',
  description: 'Piyasa analizleri, finansal rehberler ve güncel yorumlar. Finans dünyasındaki gelişmeleri yakından takip edin.',
  keywords: ['finans bilgi merkezi', 'piyasa analizi', 'yatırım rehberi', 'borsa haberleri'],
};

export default function BlogPage() {
  return <BlogListClient />;
}
