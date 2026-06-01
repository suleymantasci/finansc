'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { API_URL, SSE_RECONNECT_DELAY } from '@/lib/constants';
import type { MarketConnectionStatus } from '@/components/shared/MarketStatus';

interface UseSSEOptions<T> {
  url: string;
  onMessage: (data: T) => void;
  enabled?: boolean;
}

function useSSE<T>({ url, onMessage, enabled = true }: UseSSEOptions<T>) {
  const [status, setStatus] = useState<MarketConnectionStatus>('disconnected');
  const esRef = useRef<EventSource | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
    }

    const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
    setStatus('connecting');

    const es = new EventSource(fullUrl);
    esRef.current = es;

    es.onopen = () => {
      setStatus('connected');
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as T;
        onMessageRef.current(data);
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      setStatus('disconnected');
      es.close();
      esRef.current = null;

      // Auto-reconnect
      reconnectRef.current = setTimeout(() => {
        if (enabled) connect();
      }, SSE_RECONNECT_DELAY);
    };
  }, [url, enabled]);

  const disconnect = useCallback(() => {
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
    }
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    setStatus('disconnected');
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return { status, disconnect, reconnect: connect };
}

export { useSSE };
export type { UseSSEOptions };
