const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (name, parent, ...args) {
  return resolveFilename.call(this, name.startsWith('@/') ? path.resolve(__dirname, '../src', name.slice(2)) : name, parent, ...args);
};
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText, filename);
};

const { NextRequest } = require('next/server');
const { proxy } = require('../src/proxy.ts');
const { verifySession } = require('../src/lib/server-session.ts');
const { useAuthStore } = require('../src/stores/auth.store.ts');
const { api } = require('../src/lib/api.ts');
const user = { id: 'test-user', email: 'test@example.test', role: 'user', isActive: true, firstName: 'Test', lastName: 'User' };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const originalFetch = global.fetch;
test.afterEach(() => { global.fetch = originalFetch; useAuthStore.getState().clearAuth(); });

test('a forged legacy admin cookie cannot open /admin', async () => {
  global.fetch = () => { throw new Error('No backend lookup needed for legacy cookies'); };
  const response = await proxy(new NextRequest('https://finanscozum.net/admin', {
    headers: { cookie: 'finanscozum-token=invalid; finanscozum-role=admin' },
  }));
  assert.equal(response.status, 307);
  assert.match(response.headers.get('location'), /\/giris/);
});

test('invalid access cookies and database user roles cannot grant admin access', async () => {
  global.fetch = async () => json(user);
  const response = await proxy(new NextRequest('https://finanscozum.net/admin', {
    headers: { cookie: 'fsc-access=synthetic; finanscozum-role=admin' },
  }));
  assert.equal(response.headers.get('location'), 'https://finanscozum.net/');
  global.fetch = async () => json({}, 401);
  const invalid = await proxy(new NextRequest('https://finanscozum.net/admin', { headers: { cookie: 'fsc-access=invalid' } }));
  assert.match(invalid.headers.get('location'), /\/giris/);
});

test('only a backend-verified active admin can open /admin', async () => {
  global.fetch = async () => json({ ...user, role: 'admin' });
  const response = await proxy(new NextRequest('https://finanscozum.net/admin', { headers: { cookie: 'fsc-access=synthetic' } }));
  assert.equal(response.headers.get('x-middleware-next'), '1');
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  global.fetch = async () => json({ ...user, role: 'admin', isActive: false });
  const disabled = await proxy(new NextRequest('https://finanscozum.net/admin', { headers: { cookie: 'fsc-access=synthetic' } }));
  assert.match(disabled.headers.get('location'), /\/giris/);
});

test('backend outages fail closed for protected pages without accepting a cookie role', async () => {
  global.fetch = async () => { throw new Error('Backend unavailable'); };
  const response = await proxy(new NextRequest('https://finanscozum.net/admin', { headers: { cookie: 'fsc-access=synthetic' } }));
  assert.equal(response.status, 503);
});

test('server refresh coalesces simultaneous requests and forwards HttpOnly cookies', async () => {
  let calls = 0;
  global.fetch = async (url, options) => {
    calls++;
    assert.ok(String(url).endsWith('/api/auth/refresh'));
    assert.equal(options.headers['X-Session-Mode'], 'cookie');
    assert.equal(options.headers.Cookie, 'fsc-refresh=synthetic-refresh');
    const response = json({ user });
    response.headers.append('Set-Cookie', 'fsc-access=rotated; Path=/; HttpOnly; Secure; SameSite=Lax');
    return response;
  };
  const request = new NextRequest('https://finanscozum.net/hesabim', { headers: { cookie: 'fsc-refresh=synthetic-refresh' } });
  const results = await Promise.all([verifySession(request), verifySession(request)]);
  assert.equal(calls, 1);
  assert.equal(results[0].user.id, user.id);
  assert.match(results[0].cookies[0], /HttpOnly/);
});

test('browser auth state stores no access or refresh credentials', () => {
  useAuthStore.getState().setAuth(user);
  const state = useAuthStore.getState();
  assert.equal(state.user.id, user.id);
  assert.equal('accessToken' in state, false);
  assert.equal('refreshToken' in state, false);
});

test('parallel authenticated API requests refresh once using cookies, not JavaScript tokens', async () => {
  const attempts = new Map();
  let refreshCalls = 0;
  global.fetch = async (url, options) => {
    assert.equal(options.credentials, 'include');
    assert.equal(options.headers['X-Session-Mode'], 'cookie');
    assert.equal(options.headers.Authorization, undefined);
    if (String(url).endsWith('/api/auth/refresh')) {
      refreshCalls++;
      assert.deepEqual(JSON.parse(options.body), {});
      await new Promise((resolve) => setTimeout(resolve, 5));
      return json({ user });
    }
    const count = attempts.get(url) ?? 0;
    attempts.set(url, count + 1);
    return count === 0 ? json({}, 401) : json({ ok: true });
  };
  const results = await Promise.all([api.get('/api/favorites'), api.get('/api/auth/me')]);
  assert.equal(refreshCalls, 1);
  assert.deepEqual(results, [{ ok: true }, { ok: true }]);
});

test('a rejected login is not retried as an existing cookie session', async () => {
  let calls = 0;
  global.fetch = async (url) => { calls++; assert.ok(String(url).endsWith('/api/auth/login')); return json({ message: 'E-posta veya şifre hatalı' }, 401); };
  await assert.rejects(api.post('/api/auth/login', { email: user.email, password: 'invalid-test-password' }), /şifre hatalı/);
  assert.equal(calls, 1);
});
