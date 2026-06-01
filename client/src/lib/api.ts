import { useAuthStore } from '@/stores/auth.store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
  _isRetry?: boolean;
};

async function tryRefreshToken(): Promise<boolean> {
  const { refreshToken, setAuth, clearAuth } = useAuthStore.getState();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      clearAuth();
      return false;
    }

    const data = await res.json();
    setAuth(data.user, data.accessToken, data.refreshToken);
    return true;
  } catch {
    clearAuth();
    return false;
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, token, _isRetry } = options;

  // Auto-attach token from store if not explicitly provided
  const authToken = token ?? useAuthStore.getState().accessToken ?? undefined;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  const res = await fetch(`${API_BASE}${endpoint}`, config);

  // On 401, try refreshing the token once
  if (res.status === 401 && !_isRetry && authToken) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      return request<T>(endpoint, { ...options, _isRetry: true });
    }
    // Refresh failed → clear auth and redirect to login
    if (typeof window !== 'undefined') {
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
