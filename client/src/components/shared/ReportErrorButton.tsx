'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

interface Props {
  type: 'tool' | 'blog';
  slug: string;
  pageTitle: string;
}

export function ReportErrorButton({ type, slug, pageTitle }: Props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async () => {
    setStatus('loading');
    try {
      await api.post('/api/reports', { type, slug, pageTitle, message: message.trim() || undefined });
      setStatus('success');
      setTimeout(() => {
        setOpen(false);
        setStatus('idle');
        setMessage('');
      }, 1500);
    } catch {
      setStatus('error');
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-orange-300 hover:text-orange-600 dark:hover:border-orange-700 dark:hover:text-orange-400"
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        Hata Bildir
      </button>

      <Modal open={open} onClose={() => { setOpen(false); setStatus('idle'); setMessage(''); }} title="Hata Bildir" size="sm">
        {status === 'success' ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <CheckCircle className="h-10 w-10 text-green-500" />
            <p className="text-sm font-medium">Bildiriminiz alındı, teşekkürler!</p>
          </div>
        ) : (
          <>
            <div className="mb-4 rounded-lg bg-muted/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">
                {type === 'tool' ? 'Araç' : 'Yazı'}:{' '}
                <span className="font-medium text-foreground">{pageTitle}</span>
              </p>
            </div>

            <label className="mb-1.5 block text-sm font-medium">
              Açıklama <span className="text-xs font-normal text-muted-foreground">(opsiyonel)</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hatayı kısaca açıklayın..."
              rows={3}
              maxLength={1000}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />

            {status === 'error' && (
              <p className="mt-2 text-xs text-red-500">Bir hata oluştu, lütfen tekrar deneyin.</p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { setOpen(false); setStatus('idle'); setMessage(''); }}>
                İptal
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={status === 'loading'}>
                {status === 'loading' ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                Gönder
              </Button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
