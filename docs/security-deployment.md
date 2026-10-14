# Security update deployment

The security migration adds `users.tokenVersion` and revokes existing refresh tokens. Existing users must sign in again. Publishing scripts still use the bearer-token API and must obtain a fresh access token. The historically exposed admin password is refused for admin login, password changes, and password resets.

Browser credentials are now stored in HttpOnly, Secure, SameSite=Lax cookies. Production `AUTH_COOKIE_DOMAIN` defaults to `finanscozum.net`; leave it empty for localhost development. The frontend uses the backend `/api/auth/me` response to authorize protected pages. Cookie-authenticated mutations require an Origin in `CORS_ORIGIN`.

SMTP requires TLS and verifies the server certificate. The deployed mail server has a currently valid Let's Encrypt certificate for `mail.finanscozum.net`; compose defaults `SMTP_TLS_SERVERNAME` to that name while connecting to the internal `mailserver` service. Override that variable if the certificate hostname changes. For a private CA, place its PEM under `/docker/finansc/certs` and set `SMTP_SSL_CA_FILE=/app/certs/<ca-file>.pem`. The CA file must be readable by uid 1000. A trusted private CA augments validation; certificate verification is never disabled by the application.

Production DB TLS now defaults to enabled. Set `DB_SSL=true` for remote database connections, use a certificate whose hostname matches `DB_HOST`, and configure `DB_SSL_CA_FILE` if a private CA is needed. An explicit `DB_SSL=false` remains available for a trusted private/local database network; it provides no transport encryption. Do not use it for a public-network database connection. Production DB passwords cannot be empty.

The inspected server environment currently explicitly sets `DB_SSL=false` with an IP-address DB host. The database certificate and network route could not be verified from this workspace. Enabling verified DB TLS on that deployment remains an infrastructure task; the new default does not override the existing explicit setting.

The example DB password has been removed. The current `/docker/finansc/.env` password was compared without printing either value and differs from the public example. If any other deployment ever used the example value, rotate it in the database and deployment environment. Removing a value from the current tree does not remove it from Git history. Old history remains until a separately coordinated history rewrite; password rotation is required regardless of history cleanup.

Both Docker runtime stages run as `node` (uid 1000). The deploy workflow prepares the existing uploads directory for that user and installs the compose file from the exact deployed commit. It preserves the previous compose file. CA certificates and production secrets remain on the server; they are not included in images or source control.

Dependencies are installed from the frozen lockfile. The deployed versions are Next.js 16.3.8, Nodemailer 10.0.16, Multer 2.4.0, and Sharp 0.35.5. The CI checks include session/CSRF/upload regressions and real PostgreSQL tests of concurrent token consumption before images are built and deployed.

Run the checks locally:

```sh
pnpm install --frozen-lockfile
pnpm --filter @finanscozum/backend test:security
pnpm --filter @finanscozum/client test:security
pnpm --filter @finanscozum/client exec tsc --noEmit --incremental false
pnpm --filter @finanscozum/client test
```

Set `TEST_DATABASE_URL` to an isolated local PostgreSQL instance to run the integration checks. Tests create and remove a uniquely named schema; they do not use production configuration. Without that variable, PostgreSQL integration tests are skipped.

Local verification on 14 October 2026: backend compilation, frontend TypeScript checking, 23 security regression tests, 54 existing calculator tests, and frozen-lockfile validation passed. The two real PostgreSQL integration tests require CI's isolated database and were not run locally. A full frontend production build could not complete here because Google Fonts was unreachable and the sandbox denied build subprocess/port operations. Docker runtime access and deployment validation were unavailable. These local limits must not be treated as successful deployment checks.
