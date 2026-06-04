import { api } from '@/lib/api';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import type { BlogPost } from '@/types';
import { BlogDetailClient } from './BlogDetailClient';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

function extractFAQFromContent(html: string): { question: string; answer: string }[] {
  const faqRegex = /<h[23][^>]*>(.*?\?)<\/h[23]>\s*<p>([\s\S]*?)<\/p>/gi;
  const faqs: { question: string; answer: string }[] = [];
  let match: RegExpExecArray | null;
  while ((match = faqRegex.exec(html)) !== null) {
    const question = match[1].replace(/<[^>]*>/g, '').trim();
    const answer = match[2].replace(/<[^>]*>/g, '').trim();
    if (question && answer) faqs.push({ question, answer });
  }
  return faqs;
}

function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, '');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await api.get<BlogPost>(`/api/blogs/${slug}`);
    const title = post.seoTitle || post.title;
    const description = post.seoDescription || post.excerpt || undefined;
    const image = post.thumbnailUrl || `${SITE_URL}/og-default.png`;

    return {
      title,
      description,
      keywords: post.seoKeywords ? post.seoKeywords.split(',').map((k) => k.trim()) : undefined,
      alternates: {
        canonical: `${SITE_URL}/blog/${post.slug}`,
      },
      openGraph: {
        type: 'article',
        title,
        description,
        url: `${SITE_URL}/blog/${post.slug}`,
        siteName: SITE_NAME,
        locale: 'tr_TR',
        images: [{ url: image, width: 1200, height: 630, alt: post.title }],
        publishedTime: post.publishedAt || post.createdAt,
        modifiedTime: post.updatedAt,
        section: post.category || 'Finans',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [image],
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

  const readingTime = post ? estimateReadingTime(post.content) : 0;
  const faqs = post ? extractFAQFromContent(post.content) : [];

  // NewsArticle JSON-LD (Google News + GEO + AI citation)
  const articleJsonLd = post ? {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || '',
    image: [post.thumbnailUrl || `${SITE_URL}/og-default.png`],
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt,
    inLanguage: 'tr-TR',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${post.slug}`,
    },
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
        width: 512,
        height: 512,
      },
    },
    articleSection: post.category || 'Finans',
    wordCount: post.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length,
    timeRequired: `PT${readingTime}M`,
    keywords: post.seoKeywords || post.category,
    isAccessibleForFree: true,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', 'h2', '.article-summary', '.faq-item'],
    },
    about: [
      { '@type': 'Thing', name: 'Finans' },
      { '@type': 'Thing', name: 'Yatırım' },
      { '@type': 'Thing', name: post.category || 'Piyasalar' },
    ],
    citation: [
      { '@type': 'CreativeWork', name: 'Türkiye Cumhuriyet Merkez Bankası', url: 'https://www.tcmb.gov.tr' },
      { '@type': 'CreativeWork', name: 'Borsa İstanbul', url: 'https://www.borsaistanbul.com' },
    ],
  } : null;

  // BreadcrumbList JSON-LD
  const breadcrumbJsonLd = post ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Bilgi Merkezi', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title },
    ],
  } : null;

  // FAQPage JSON-LD (only if questions found)
  const faqJsonLd = faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  } : null;

  return (
    <>
      {articleJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      )}
      {breadcrumbJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      )}
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <BlogDetailClient post={post} relatedPosts={relatedPosts} readingTime={readingTime} />
    </>
  );
}
