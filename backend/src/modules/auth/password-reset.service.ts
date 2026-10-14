import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, MoreThan, Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { createHash, randomBytes } from 'crypto';
import { User, UserRole } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { tlsOptions } from '../../config/tls';
import { isExposedAdminPassword } from '../../common/public-passwords';

const TOKEN_TTL_MIN = 30;
const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');

/**
 * Şifre sıfırlama.
 * - Hesap var mı yok mu dışarıya sızdırılmaz: her istek aynı yanıtı alır.
 * - Token 32 bayt rastgele; DB'de yalnızca özeti, 30 dk geçerli, tek kullanımlık.
 * - Şifre değişince kullanıcının tüm oturumları (refresh token) iptal edilir.
 */
@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);
  private readonly transporter: Transporter | null;

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(RefreshToken) private readonly refresh: Repository<RefreshToken>,
    @InjectRepository(PasswordResetToken) private readonly tokens: Repository<PasswordResetToken>,
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
  ) {
    const host = config.get<string>('SMTP_HOST');
    const user = config.get<string>('SMTP_USER');
    const pass = config.get<string>('SMTP_PASS');
    const port = parseInt(config.get<string>('SMTP_PORT') ?? '587', 10);
    this.transporter =
      host && user && pass
        ? nodemailer.createTransport({ host, port, secure: port === 465, requireTLS: port !== 465, auth: { user, pass }, tls: tlsOptions(config, 'SMTP'), connectionTimeout: 10000 })
        : null;
  }

  private siteUrl(): string {
    const explicit = this.config.get<string>('SITE_URL');
    if (explicit) return explicit.replace(/\/$/, '');
    const first = (this.config.get<string>('CORS_ORIGIN') ?? '').split(',')[0]?.trim();
    return (first || 'https://finanscozum.net').replace(/\/$/, '');
  }

  async requestReset(email: string): Promise<{ ok: true }> {
    const user = await this.users.findOne({ where: { email: email.trim().toLowerCase() } });
    if (user && user.isActive) {
      const raw = randomBytes(32).toString('hex');
      const issued = await this.dataSource.transaction(async (manager) => {
        const active = await manager.getRepository(User).findOne({ where: { id: user.id }, lock: { mode: 'pessimistic_write' } });
        if (!active?.isActive) return false;
        const tokens = manager.getRepository(PasswordResetToken);
        await tokens.update({ userId: user.id, usedAt: IsNull() }, { usedAt: new Date() });
        await tokens.save(tokens.create({ userId: user.id, tokenHash: sha256(raw), expiresAt: new Date(Date.now() + TOKEN_TTL_MIN * 60_000), usedAt: null }));
        return true;
      });
      if (!issued) return { ok: true };
      const link = `${this.siteUrl()}/sifre-sifirla?token=${raw}`;
      if (this.transporter) {
        try {
          await this.transporter.sendMail({
            from: this.config.get<string>('SMTP_FROM') ?? 'noreply@finanscozum.net',
            to: user.email,
            subject: 'FinansÇözüm şifre sıfırlama',
            text: `Merhaba,\n\nŞifrenizi sıfırlamak için aşağıdaki bağlantıyı ${TOKEN_TTL_MIN} dakika içinde açın:\n${link}\n\nBu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz; şifreniz değişmez.\n\nFinansÇözüm`,
          });
        } catch (e) {
          this.logger.error(`Sıfırlama e-postası gönderilemedi: ${(e as Error).message}`);
        }
      } else {
        this.logger.warn('SMTP tanımlı değil — sıfırlama e-postası gönderilmedi');
      }
    }
    // Eski kayıtları temizle (fırsatçı)
    await this.tokens.delete({ expiresAt: LessThan(new Date(Date.now() - 24 * 3600_000)) });
    return { ok: true };
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<{ ok: true }> {
    const rec = await this.tokens.findOne({ where: { tokenHash: sha256(rawToken), usedAt: IsNull(), expiresAt: MoreThan(new Date()) } });
    if (!rec) throw new BadRequestException('Bağlantı geçersiz veya süresi dolmuş. Lütfen yeniden şifre sıfırlama isteyin.');
    const passwordHash = await bcrypt.hash(newPassword, 12);
    return this.dataSource.transaction(async (manager) => {
      const users = manager.getRepository(User);
      const user = await users.findOne({ where: { id: rec.userId }, lock: { mode: 'pessimistic_write' } });
      if (!user?.isActive) throw new BadRequestException('Bağlantı geçersiz veya süresi dolmuş.');
      if (user.role === UserRole.ADMIN && isExposedAdminPassword(newPassword)) throw new BadRequestException('Bu şifre kullanılamaz');
      const consumed = await manager.getRepository(PasswordResetToken).update(
        { id: rec.id, usedAt: IsNull(), expiresAt: MoreThan(new Date()) }, { usedAt: new Date() },
      );
      if (consumed.affected !== 1) throw new BadRequestException('Bağlantı geçersiz veya süresi dolmuş.');
      user.passwordHash = passwordHash;
      user.tokenVersion += 1;
      await users.save(user);
      await manager.getRepository(RefreshToken).update({ userId: user.id, isRevoked: false }, { isRevoked: true });
      return { ok: true as const };
    });
  }
}
