import { createHash } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { API_URL, SITE_URL } from '@/lib/constants';
import type { AuthUser } from '@/types';

type Session = { user: AuthUser | null; cookies: string[]; unavailable?: boolean };
const refreshes = new Map<string, Promise<Session>>();
const validUser = (value: AuthUser | null | undefined) =>
  value?.isActive && typeof value.id === 'string' && ['admin', 'user'].includes(value.role) ? value : null;

async function refresh(refreshToken: string): Promise<Session> {
  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(8000),
      headers: {
        'Content-Type': 'application/json', 'X-Session-Mode': 'cookie',
        Origin: new URL(SITE_URL).origin,
        Cookie: `fsc-refresh=${encodeURIComponent(refreshToken)}`,
      },
      body: '{}',
    });
    const cookies = response.headers.getSetCookie();
    if (!response.ok) return { user: null, cookies, unavailable: response.status !== 401 };
    const body = await response.json();
    return { user: validUser(body.user), cookies };
  } catch { return { user: null, cookies: [], unavailable: true }; }
}

export async function verifySession(request: NextRequest): Promise<Session> {
  const access = request.cookies.get('fsc-access')?.value;
  const refreshToken = request.cookies.get('fsc-refresh')?.value;
  if (access) {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${access}` }, cache: 'no-store', signal: AbortSignal.timeout(8000),
      });
      if (response.ok) return { user: validUser(await response.json()), cookies: [] };
      if (response.status !== 401) return { user: null, cookies: [], unavailable: true };
    } catch { return { user: null, cookies: [], unavailable: true }; }
  }
  if (!refreshToken) return { user: null, cookies: [] };
  const key = createHash('sha256').update(refreshToken).digest('hex');
  let pending = refreshes.get(key);
  if (!pending) {
    pending = refresh(refreshToken).finally(() => { refreshes.delete(key); });
    refreshes.set(key, pending);
  }
  return pending;
}
