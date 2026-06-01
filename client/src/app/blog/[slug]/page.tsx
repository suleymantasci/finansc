import { api } from '@/lib/api';
import type { BlogPost } from '@/types';
import { BlogDetailClient } from './BlogDetailClient';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await api.get<BlogPost>(`/api/blogs/${slug}`);
    return {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt || undefined,
      keywords: post.seoKeywords ? post.seoKeywords.split(',').map((k) => k.trim()) : undefined,
      openGraph: {
        title: post.seoTitle || post.title,
        description: post.seoDescription || post.excerpt || undefined,
        images: post.thumbnailUrl ? [post.thumbnailUrl] : undefined,
      },
    };
  } catch {
    return { title: 'Bilgi Merkezi' };
  }
}

export default async function BlogSlugPage({ params }: Props) {
  const { slug } = await params;
  let post: BlogPost | null = null;
  let relatedPosts: BlogPost[] = [];

  try {
    post = await api.get<BlogPost>(`/api/blogs/${slug}`);
    const res = await api.get<{ data: BlogPost[] }>(`/api/blogs?limit=3&status=published&category=${post.category || ''}`);
    relatedPosts = (res.data || []).filter((p) => p.slug !== slug).slice(0, 3);
  } catch {
    // handled in client
  }

  return <BlogDetailClient post={post} relatedPosts={relatedPosts} />;
}
