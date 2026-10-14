const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID, createHash } = require('node:crypto');
const { mkdtemp, readFile, rm, readdir } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const path = require('node:path');
const bcrypt = require('bcrypt');
const sharp = require('sharp');
const express = require('express');
const { ConfigService } = require('@nestjs/config');
const { JwtService } = require('@nestjs/jwt');
const { ValidationPipe } = require('@nestjs/common');
const { AuthService } = require('../dist/modules/auth/auth.service');
const { AuthController } = require('../dist/modules/auth/auth.controller');
const { PasswordResetService } = require('../dist/modules/auth/password-reset.service');
const { JwtStrategy } = require('../dist/modules/auth/strategies/jwt.strategy');
const { UploadService } = require('../dist/modules/upload/upload.service');
const { BlogService } = require('../dist/modules/blog/blog.service');
const { User } = require('../dist/modules/users/entities/user.entity');
const { RefreshToken } = require('../dist/modules/auth/entities/refresh-token.entity');
const { PasswordResetToken } = require('../dist/modules/auth/entities/password-reset-token.entity');
const { CreateReportDto } = require('../dist/modules/reports/dto/create-report.dto');
const { assertSessionOrigin, setSessionCookies, clearSessionCookies } = require('../dist/common/session');
const { tlsOptions } = require('../dist/config/tls');

const sha256 = (text) => createHash('sha256').update(text).digest('hex');
const config = () => new ConfigService({
  NODE_ENV: 'production', AUTH_COOKIE_DOMAIN: 'finanscozum.net',
  CORS_ORIGIN: 'https://finanscozum.net,https://www.finanscozum.net',
  JWT_ACCESS_SECRET: 'security-test-key-'.repeat(4), JWT_ACCESS_EXPIRES: '15m', JWT_REFRESH_EXPIRES: '7d',
});

function matches(row, conditions) {
  return Object.entries(conditions).every(([key, value]) => {
    if (value && typeof value === 'object' && typeof value.type === 'string') {
      if (value.type === 'isNull') return row[key] == null;
      if (value.type === 'moreThan') return row[key] > value.value;
      if (value.type === 'lessThan') return row[key] < value.value;
    }
    return row[key] === value;
  });
}

// Transactions serialize like the user row locks in Postgres. Rollback is modeled
// so failed token consumption cannot leave a changed password or revoked session.
async function fixture(overrides = {}) {
  let state = {
    User: [{ id: randomUUID(), email: 'test@example.test', firstName: 'Test', lastName: 'User',
      role: 'user', isActive: true, tokenVersion: 0, passwordHash: await bcrypt.hash('old-test-password', 4), ...overrides }],
    RefreshToken: [], PasswordResetToken: [],
  };
  const repositories = new Map();
  for (const entity of [User, RefreshToken, PasswordResetToken]) {
    const name = entity.name;
    const repo = {
      findOne: async (options) => structuredClone(state[name].find((row) => matches(row, options.where)) ?? null),
      create: (row) => ({ id: randomUUID(), ...row }),
      save: async (row) => {
        const index = state[name].findIndex((current) => current.id === row.id);
        if (index < 0) state[name].push(structuredClone(row));
        else state[name][index] = { ...state[name][index], ...structuredClone(row) };
        return structuredClone(row);
      },
      update: async (where, updates) => {
        let affected = 0;
        for (const row of state[name]) if (matches(row, where)) { Object.assign(row, updates); affected++; }
        return { affected };
      },
      increment: async (where, field, amount) => {
        for (const row of state[name]) if (matches(row, where)) row[field] += amount;
      },
      delete: async (where) => { state[name] = state[name].filter((row) => !matches(row, where)); },
    };
    repositories.set(entity, repo);
  }
  let queue = Promise.resolve();
  const manager = { getRepository: (entity) => repositories.get(entity) };
  const dataSource = {
    manager,
    transaction: (work) => {
      const job = queue.then(async () => {
        const previous = structuredClone(state);
        try { return await work(manager); } catch (error) { state = previous; throw error; }
      });
      queue = job.catch(() => {});
      return job;
    },
  };
  const jwt = new JwtService();
  const users = repositories.get(User);
  const refresh = repositories.get(RefreshToken);
  const reset = repositories.get(PasswordResetToken);
  const service = new AuthService(users, refresh, jwt, config(), dataSource);
  const passwordReset = new PasswordResetService(users, refresh, reset, config(), dataSource);
  const strategy = new JwtStrategy(config(), users);
  const addRefresh = async (value = randomUUID()) => {
    await refresh.save(refresh.create({ userId: state.User[0].id, tokenHash: sha256(value), isRevoked: false, expiresAt: new Date(Date.now() + 60000) }));
    return value;
  };
  return { service, passwordReset, strategy, users, refresh, reset, jwt, addRefresh, state: () => state };
}

test('inactive accounts cannot refresh or use access tokens', async () => {
  const f = await fixture({ isActive: false });
  const token = await f.addRefresh();
  await assert.rejects(f.service.refreshTokens(token), /devre dışı/);
  await assert.rejects(f.strategy.validate({ sub: f.state().User[0].id, ver: 0, role: 'admin' }), /Oturum geçersiz/);
});

test('password change revokes old refresh/access tokens and rotates the current session', async () => {
  const f = await fixture();
  const oldRefresh = await f.addRefresh();
  const id = f.state().User[0].id;
  const result = await f.service.changePassword(id, { currentPassword: 'old-test-password', newPassword: 'new-test-password' });
  assert.equal(f.jwt.decode(result.accessToken).ver, 1);
  assert.equal(await bcrypt.compare('new-test-password', f.state().User[0].passwordHash), true);
  await assert.rejects(f.service.refreshTokens(oldRefresh));
  await assert.rejects(f.strategy.validate({ sub: id, ver: 0 }));
  assert.equal((await f.strategy.validate(f.jwt.decode(result.accessToken))).id, id);
});

test('wrong current password rolls back without revoking sessions', async () => {
  const f = await fixture();
  const token = await f.addRefresh();
  await assert.rejects(f.service.changePassword(f.state().User[0].id, { currentPassword: 'incorrect', newPassword: 'new-test-password' }));
  assert.equal(f.state().User[0].tokenVersion, 0);
  assert.equal(f.state().RefreshToken[0].isRevoked, false);
  assert.ok(await f.service.refreshTokens(token));
});

test('logout invalidates access tokens and all existing refresh tokens', async () => {
  const f = await fixture();
  const token = await f.addRefresh();
  const id = f.state().User[0].id;
  await f.service.logout(id);
  await assert.rejects(f.strategy.validate({ sub: id, ver: 0 }));
  await assert.rejects(f.service.refreshTokens(token));
});

test('JWT authorization uses the current database role, not the embedded role', async () => {
  const f = await fixture({ role: 'user' });
  const verified = await f.strategy.validate({ sub: f.state().User[0].id, ver: 0, role: 'admin' });
  assert.equal(verified.role, 'user');
  await assert.rejects(f.strategy.validate({ sub: verified.id, role: 'admin' }));
});

test('only one concurrent refresh consumes a token', async () => {
  const f = await fixture();
  const token = await f.addRefresh();
  const results = await Promise.allSettled([f.service.refreshTokens(token), f.service.refreshTokens(token)]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(f.state().RefreshToken.filter((row) => !row.isRevoked).length, 1);
});

test('only one concurrent reset changes the password and every old session is revoked', async () => {
  const f = await fixture();
  await f.addRefresh();
  const raw = randomUUID();
  await f.reset.save(f.reset.create({ userId: f.state().User[0].id, tokenHash: sha256(raw), usedAt: null, expiresAt: new Date(Date.now() + 60000) }));
  const results = await Promise.allSettled([
    f.passwordReset.resetPassword(raw, 'new-test-password-one'), f.passwordReset.resetPassword(raw, 'new-test-password-two'),
  ]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(f.state().User[0].tokenVersion, 1);
  assert.equal(f.state().RefreshToken[0].isRevoked, true);
  assert.ok(f.state().PasswordResetToken[0].usedAt);
});

test('expired refresh/reset tokens cannot change sessions or passwords', async () => {
  const f = await fixture();
  const token = await f.addRefresh();
  await f.refresh.update({ tokenHash: sha256(token) }, { expiresAt: new Date(0) });
  await assert.rejects(f.service.refreshTokens(token));
  const raw = randomUUID();
  await f.reset.save(f.reset.create({ userId: f.state().User[0].id, tokenHash: sha256(raw), usedAt: null, expiresAt: new Date(0) }));
  await assert.rejects(f.passwordReset.resetPassword(raw, 'new-test-password'));
  assert.equal(f.state().User[0].tokenVersion, 0);
});

function response() {
  const headers = {};
  const res = Object.create(express.response);
  res.req = {};
  res.get = (key) => headers[key.toLowerCase()];
  res.set = res.setHeader = (key, value) => { headers[key.toLowerCase()] = value; return res; };
  return { res, headers };
}

test('session cookies are HttpOnly, Secure, SameSite and cleared with identical scope', () => {
  const { res, headers } = response();
  setSessionCookies(res, { accessToken: 'synthetic-access', refreshToken: 'synthetic-refresh' }, config());
  assert.equal(headers['set-cookie'].length, 2);
  for (const cookie of headers['set-cookie']) {
    assert.match(cookie, /HttpOnly/); assert.match(cookie, /Secure/);
    assert.match(cookie, /SameSite=Lax/); assert.match(cookie, /Domain=finanscozum\.net/);
  }
  assert.equal(headers['cache-control'], 'no-store');
  clearSessionCookies(res, config());
  assert.match(headers['set-cookie'][2], /Expires=Thu, 01 Jan 1970/);
  assert.match(headers['set-cookie'][2], /Domain=finanscozum\.net/);
});

test('cookie login returns only user data; publishing API clients retain bearer tokens', async () => {
  const tokens = { user: { id: 'test-user' }, accessToken: 'synthetic-access', refreshToken: 'synthetic-refresh' };
  const controller = new AuthController({ login: async () => tokens }, {}, config());
  const cookieResponse = response();
  const cookieResult = await controller.login({}, { headers: { 'x-session-mode': 'cookie' } }, cookieResponse.res);
  assert.deepEqual(cookieResult, { user: tokens.user });
  assert.equal(cookieResponse.headers['set-cookie'].length, 2);
  const bearerResponse = response();
  assert.deepEqual(await controller.login({}, { headers: {} }, bearerResponse.res), tokens);
  assert.equal(bearerResponse.headers['set-cookie'], undefined);
});

test('CSRF rejects foreign/missing Origin for cookie mutations including forged bearer headers', () => {
  for (const headers of [
    { cookie: 'fsc-access=synthetic', origin: 'https://evil.example' },
    { cookie: 'fsc-refresh=synthetic' },
    { 'x-session-mode': 'cookie', authorization: 'Bearer synthetic', origin: 'https://evil.example' },
  ]) assert.throws(() => assertSessionOrigin({ method: 'POST', headers }, config()));
  assert.doesNotThrow(() => assertSessionOrigin({ method: 'POST', headers: { 'x-session-mode': 'cookie', origin: 'https://finanscozum.net' } }, config()));
  assert.doesNotThrow(() => assertSessionOrigin({ method: 'POST', headers: { authorization: 'Bearer synthetic' } }, config()));
});

test('TLS certificate validation cannot be disabled by the TLS helper', () => {
  assert.equal(tlsOptions(config(), 'DB').rejectUnauthorized, true);
  assert.equal(tlsOptions(config(), 'SMTP').rejectUnauthorized, true);
  const f = new PasswordResetService({}, {}, {}, new ConfigService({ SMTP_HOST: 'smtp.example.test', SMTP_USER: 'test', SMTP_PASS: 'test', SMTP_PORT: '587' }), {});
  assert.equal(f.transporter.options.requireTLS, true);
  assert.equal(f.transporter.options.tls.rejectUnauthorized, true);
});

test('report DTO rejects excessive messages, invalid types and extra properties', async () => {
  const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
  const metadata = { type: 'body', metatype: CreateReportDto };
  const valid = { type: 'blog', slug: 'test', pageTitle: 'Test' };
  await assert.rejects(pipe.transform({ ...valid, message: 'x'.repeat(5001) }, metadata));
  await assert.rejects(pipe.transform({ ...valid, type: 'unexpected' }, metadata));
  await assert.rejects(pipe.transform({ ...valid, status: 'resolved' }, metadata));
  assert.equal((await pipe.transform(valid, metadata)).type, 'blog');
});

test('upload rejects forged image content and persists normalized WebP for valid images', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'finansc-upload-test-'));
  try {
    const service = new UploadService(new ConfigService({ UPLOAD_DIR: directory, API_PUBLIC_URL: 'https://example.test' }));
    await assert.rejects(service.saveImage({ buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'), mimetype: 'image/png', size: 20 }));
    assert.deepEqual(await readdir(directory), []);
    const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#fff' } }).png().toBuffer();
    await assert.rejects(service.saveImage({ buffer: png, mimetype: 'image/jpeg', size: png.length }));
    const url = await service.saveImage({ buffer: png, mimetype: 'image/png', size: png.length });
    assert.ok(url.endsWith('.webp'));
    const file = path.join(directory, 'thumbnails', path.basename(url));
    assert.equal((await sharp(await readFile(file)).metadata()).format, 'webp');
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('blog view writes are batched without dropping counts or changing updatedAt', async () => {
  const writes = [];
  let query;
  const builder = { update() { return this; }, set(value) { query = value; return this; },
    setParameter(key, value) { writes.push([key, value]); return this; }, where() { return this; }, execute: async () => ({ affected: 1 }) };
  const service = new BlogService({ findOne: async () => ({ slug: 'test' }), createQueryBuilder: () => builder });
  await Promise.all(Array.from({ length: 10 }, () => service.findBySlug('test')));
  assert.equal(writes.length, 0);
  await service.onModuleDestroy();
  assert.deepEqual(writes, [['count', 10]]);
  assert.equal(query.updatedAt(), '"updatedAt"');
});
