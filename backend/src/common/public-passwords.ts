import { createHash } from 'crypto';

// Fingerprint of a legacy admin password published in repository history.
export function isExposedAdminPassword(password: string): boolean {
  return createHash('sha256').update(password).digest('hex') === '3eb3fe66b31e3b4d10fa70b5cad49c7112294af6ae4e476a1c405155d45aa121';
}
