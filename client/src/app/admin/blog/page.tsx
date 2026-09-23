'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { BlogPost } from '@/types';

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPost, setEditPost] = useState<BlogPost | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchPosts = () => {
    setLoading(true);
    api.get<{ data: BlogPost[] }>('/api/blogs?limit=100')
      .then((res) => setPosts(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Bu yazıyı silmek istediğinize emin misiniz?')) return;
    await api.delete(`/api/blogs/${id}`);
    fetchPosts();
  };

  const openNew = () => { setEditPost(null); setShowModal(true); };
  const openEdit = (post: BlogPost) => { setEditPost(post); setShowModal(true); };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bilgi Merkezi Yönetimi</h1>
          <p className="mt-1 text-sm text-muted-foreground">Bilgi merkezi yazılarını oluşturun, düzenleyin ve yönetin</p>
        </div>
        <Button onClick={openNew} size="sm"><Plus className="mr-1 h-4 w-4" /> Yeni Yazı</Button>
      </div>

      <div className="mt-6">
        {loading ? (
          <SkeletonTable rows={5} cols={5} />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Başlık</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Kategori</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Durum</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Tarih</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium max-w-xs truncate">{post.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{post.category || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={post.status === 'published' ? 'success' : 'secondary'}>
                        {post.status === 'published' ? 'Yayında' : 'Taslak'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(post.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(post)} className="text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(post.id)} className="text-muted-foreground hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editPost ? 'Yazı Düzenle' : 'Yeni Yazı'}>
        <BlogForm post={editPost} onSaved={() => { setShowModal(false); fetchPosts(); }} />
      </Modal>
    </div>
  );
}

function BlogForm({ post, onSaved }: { post: BlogPost | null; onSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(post?.title || '');
  const [slug, setSlug] = useState(post?.slug || '');
  const [content, setContent] = useState(post?.content || '');
  const [excerpt, setExcerpt] = useState(post?.excerpt || '');
  const [category, setCategory] = useState(post?.category || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(post?.thumbnailUrl || '');
  const [status, setStatus] = useState<'draft' | 'published'>(post?.status || 'draft');
  const [seoTitle, setSeoTitle] = useState(post?.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(post?.seoDescription || '');
  const [seoKeywords, setSeoKeywords] = useState(post?.seoKeywords || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const body = { title, slug, content, excerpt, category, thumbnailUrl, status, seoTitle, seoDescription, seoKeywords };
    try {
      if (post) {
        await api.patch(`/api/blogs/${post.id}`, body);
      } else {
        await api.post('/api/blogs', body);
      }
      onSaved();
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <Input label="Başlık" value={title} onChange={(e) => { setTitle(e.target.value); if (!post) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')); }} />
      <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
      <Input label="Kategori" value={category} onChange={(e) => setCategory(e.target.value)} />
      <Input label="Özet" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
      <Input label="Kapak Görseli URL" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} />
      <div>
        <label className="mb-1 block text-sm font-medium">İçerik (HTML)</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm num"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Durum</label>
        <select value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'published')} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="draft">Taslak</option>
          <option value="published">Yayında</option>
        </select>
      </div>
      <Input label="SEO Başlık" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
      <Input label="SEO Açıklama" value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
      <Input label="SEO Anahtar Kelimeler" value={seoKeywords} onChange={(e) => setSeoKeywords(e.target.value)} hint="Virgülle ayırın" />
      <Button type="submit" className="w-full" loading={loading}>{post ? 'Güncelle' : 'Oluştur'}</Button>
    </form>
  );
}
