import { readFileSync } from 'fs';
import { ConfigService } from '@nestjs/config';

/** An optional trusted CA never disables certificate validation. */
export function tlsOptions(config: ConfigService, prefix: 'DB' | 'SMTP') {
  const caFile = config.get<string>(`${prefix}_SSL_CA_FILE`);
  return {
    rejectUnauthorized: true,
    ...(caFile ? { ca: readFileSync(caFile, 'utf8') } : {}),
    ...(prefix === 'SMTP' && config.get<string>('SMTP_TLS_SERVERNAME')
      ? { servername: config.get<string>('SMTP_TLS_SERVERNAME') } : {}),
  };
}
