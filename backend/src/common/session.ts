import { ConfigService } from '@nestjs/config';
import { ForbiddenException } from '@nestjs/common';
import type { Request, Response } from 'express';

export const ACCESS_COOKIE = 'fsc-access';
export const REFRESH_COOKIE = 'fsc-refresh';

export function readCookie(header: string | undefined, name: string): string | undefined {
  for (const part of (header ?? '').split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0 || part.slice(0, separator).trim() !== name) continue;
    try { return decodeURIComponent(part.slice(separator + 1).trim()); } catch { return undefined; }
  }
  return undefined;
}

export function assertSessionOrigin(req: Request, config: ConfigService): void {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return;
  const cookieMode = req.headers['x-session-mode'] === 'cookie';
  const bearer = req.headers.authorization?.startsWith('Bearer ');
  const hasCookie = readCookie(req.headers.cookie, ACCESS_COOKIE) || readCookie(req.headers.cookie, REFRESH_COOKIE);
  if (!cookieMode && (bearer || !hasCookie)) return;
  const allowed = (config.get<string>('CORS_ORIGIN') ?? '').split(',').map((value) => value.trim()).filter(Boolean);
  if (!req.headers.origin || !allowed.includes(req.headers.origin)) {
    throw new ForbiddenException('İstek kaynağı doğrulanamadı');
  }
}

function cookieOptions(config: ConfigService) {
  return {
    httpOnly: true,
    secure: config.get<string>('NODE_ENV') === 'production',
    sameSite: 'lax' as const,
    path: '/',
    ...(config.get<string>('AUTH_COOKIE_DOMAIN') ? { domain: config.get<string>('AUTH_COOKIE_DOMAIN') } : {}),
  };
}

function duration(value: string, fallback: number): number {
  const match = /^(\d+)(s|m|h|d)$/.exec(value);
  const units: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return match ? Number(match[1]) * units[match[2]]! : fallback;
}

export function setSessionCookies(response: Response, tokens: { accessToken: string; refreshToken: string }, config: ConfigService): void {
  const options = cookieOptions(config);
  response.cookie(ACCESS_COOKIE, tokens.accessToken, {
    ...options, maxAge: duration(config.get<string>('JWT_ACCESS_EXPIRES') ?? '15m', 900000),
  });
  response.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...options, maxAge: duration(config.get<string>('JWT_REFRESH_EXPIRES') ?? '7d', 604800000),
  });
  response.setHeader('Cache-Control', 'no-store');
}

export function clearSessionCookies(response: Response, config: ConfigService): void {
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE]) response.clearCookie(name, cookieOptions(config));
  response.setHeader('Cache-Control', 'no-store');
}
