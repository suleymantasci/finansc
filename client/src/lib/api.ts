import { useAuthStore } from '@/stores/auth.store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
  _isRetry?: boolean;
};

let refreshInFlight: Promise<boolean> | null = null;
async function refreshSession(): Promise<boolean> {
  const { setAuth, clearAuth } = useAuthStore.getState();
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Session-Mode': 'cookie' },
      credentials: 'include',
      body: '{}',
    });

    if (!res.ok) {
      clearAuth();
      return false;
    }

    const data = await res.json();
    setAuth(data.user);
    return true;
  } catch {
    clearAuth();
    return false;
  }
}

function tryRefreshToken(): Promise<boolean> {
  refreshInFlight ??= refreshSession().finally(() => { refreshInFlight = null; });
  return refreshInFlight;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, token, _isRetry } = options;

  const config: RequestInit = {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Mode': 'cookie',
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  const res = await fetch(`${API_BASE}${endpoint}`, config);

  // On 401, try refreshing the token once
  const publicAuth = /^\/api\/auth\/(login|register|refresh|forgot-password|reset-password)$/.test(endpoint);
  if (res.status === 401 && !_isRetry && !publicAuth) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      return request<T>(endpoint, { ...options, _isRetry: true });
    }
    // Refresh failed → clear auth and redirect to login
    if (typeof window !== 'undefined' && /^\/(admin|hesabim)(\/|$)/.test(window.location.pathname)) {
      window.location.href = '/giris';
    }
    throw new Error('Oturum süresi doldu, lütfen tekrar giriş yapın');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Bir hata oluştu' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: <T>(endpoint: string, token?: string) =>
    request<T>(endpoint, { token }),

  post: <T>(endpoint: string, body: unknown, token?: string) =>
    request<T>(endpoint, { method: 'POST', body, token }),

  put: <T>(endpoint: string, body: unknown, token?: string) =>
    request<T>(endpoint, { method: 'PUT', body, token }),

  patch: <T>(endpoint: string, body: unknown, token?: string) =>
    request<T>(endpoint, { method: 'PATCH', body, token }),

  delete: <T>(endpoint: string, token?: string) =>
    request<T>(endpoint, { method: 'DELETE', token }),
};
