const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID, createHash } = require('node:crypto');
const { DataSource } = require('typeorm');
const { ConfigService } = require('@nestjs/config');
const { JwtService } = require('@nestjs/jwt');
const bcrypt = require('bcrypt');
const { User } = require('../dist/modules/users/entities/user.entity');
const { RefreshToken } = require('../dist/modules/auth/entities/refresh-token.entity');
const { PasswordResetToken } = require('../dist/modules/auth/entities/password-reset-token.entity');
const { AuthService } = require('../dist/modules/auth/auth.service');
const { PasswordResetService } = require('../dist/modules/auth/password-reset.service');

const url = process.env.TEST_DATABASE_URL;
const schema = `fsc_security_${process.pid}_${randomUUID().replace(/-/g, '')}`;
let ds;
const sha = (value) => createHash('sha256').update(value).digest('hex');
const settings = new ConfigService({ JWT_ACCESS_SECRET: 'integration-test-secret-'.repeat(3), JWT_ACCESS_EXPIRES: '15m', JWT_REFRESH_EXPIRES: '7d' });

before(async () => {
  if (!url) return;
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname), 'Integration tests require an isolated local Postgres instance');
  ds = new DataSource({ type: 'postgres', url, schema, entities: [User, RefreshToken, PasswordResetToken], synchronize: false });
  await ds.initialize();
  await ds.query(`CREATE SCHEMA "${schema}"`);
  await ds.synchronize();
});
after(async () => {
  if (ds?.isInitialized) { await ds.query(`DROP SCHEMA "${schema}" CASCADE`); await ds.destroy(); }
});

async function services() {
  const users = ds.getRepository(User), refresh = ds.getRepository(RefreshToken), reset = ds.getRepository(PasswordResetToken);
  const user = await users.save(users.create({ firstName: 'Test', lastName: 'User', email: `${randomUUID()}@example.test`, passwordHash: await bcrypt.hash('initial-test-password', 4) }));
  return {
    user, users, refresh, reset,
    auth: new AuthService(users, refresh, new JwtService(), settings, ds),
    passwords: new PasswordResetService(users, refresh, reset, settings, ds),
  };
}

test('Postgres atomically allows only one simultaneous refresh', { skip: !url }, async () => {
  const f = await services();
  const token = randomUUID();
  await f.refresh.save(f.refresh.create({ userId: f.user.id, tokenHash: sha(token), expiresAt: new Date(Date.now() + 60000) }));
  const results = await Promise.allSettled(Array.from({ length: 6 }, () => f.auth.refreshTokens(token)));
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(await f.refresh.count({ where: { userId: f.user.id, isRevoked: false } }), 1);
});

test('Postgres atomically allows one reset and invalidates all previous sessions', { skip: !url }, async () => {
  const f = await services();
  const token = randomUUID();
  await f.reset.save(f.reset.create({ userId: f.user.id, tokenHash: sha(token), expiresAt: new Date(Date.now() + 60000), usedAt: null }));
  await f.refresh.save(f.refresh.create({ userId: f.user.id, tokenHash: sha(randomUUID()), expiresAt: new Date(Date.now() + 60000) }));
  const results = await Promise.allSettled([f.passwords.resetPassword(token, 'reset-password-one'), f.passwords.resetPassword(token, 'reset-password-two')]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal((await f.users.findOneByOrFail({ id: f.user.id })).tokenVersion, 1);
  assert.equal(await f.refresh.count({ where: { userId: f.user.id, isRevoked: false } }), 0);
});
