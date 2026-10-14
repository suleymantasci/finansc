import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { ContactMessage } from './entities/contact-message.entity';
import { CreateContactDto } from './dto/create-contact.dto';
import { tlsOptions } from '../../config/tls';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);
  private transporter: Transporter | null = null;

  // docker-mailserver SMTP üzerinden info@finanscozum.net'e mail gönderir.
  // Süleyman .env'de ayarlar (docker-compose.yml zaten env'leri geçiriyor):
  //   SMTP_HOST     — örn. mailserver (docker network hostname)
  //   SMTP_PORT     — 587 (STARTTLS) veya 25
  //   SMTP_USER     — örn. info@finanscozum.net
  //   SMTP_PASS     — mailserver'da oluşturulmuş app password
  //   SMTP_FROM     — örn. noreply@finanscozum.net
  //   MAIL_TO       — mesajların gönderileceği adres (varsayılan info@finanscozum.net)
  //
  // Bu değişkenlerden biri boşsa transporter oluşturulmaz, mail GÖNDERILMEZ,
  // sadece DB'ye yazılır (graceful fallback — kritik, form gönderimi
  // mail hatasına bağlı bloklanmaz).

  constructor(
    @InjectRepository(ContactMessage)
    private readonly repo: Repository<ContactMessage>,
    private readonly config: ConfigService,
  ) {
    this.transporter = this.createTransporter();
  }

  private createTransporter(): Transporter | null {
    const host = this.config.get<string>('SMTP_HOST');
    const port = parseInt(this.config.get<string>('SMTP_PORT') ?? '587', 10);
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      this.logger.warn(
        `[contact] SMTP_HOST/USER/PASS tanımlı değil → mail gönderilmez. info@finanscozum.net'e mail gitmesi için .env'e SMTP değerlerini ekleyin.`,
      );
      return null;
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // 465 = TLS, 587 = STARTTLS
      auth: { user, pass },
      requireTLS: port !== 465,
      tls: tlsOptions(this.config, 'SMTP'),
      // Timeout'lar — backend'i bloklamamalı
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 15000,
    });
  }

  /**
   * Yeni iletişim mesajı kaydeder.
   * 1) DB'ye yazar (her zaman)
   * 2) SMTP ile info@finanscozum.net'e mail gönderir (transporter varsa;
   *    hata olursa logla, exception fırlatma).
   */
  async create(
    dto: CreateContactDto,
    meta: { ipAddress?: string; userAgent?: string } = {},
  ): Promise<ContactMessage> {
    const msg = this.repo.create({
      name: dto.name,
      email: dto.email,
      subject: dto.subject,
      message: dto.message,
      ipAddress: meta.ipAddress ?? null,
      userAgent: meta.userAgent ?? null,
    });
    const saved = await this.repo.save(msg);

    this.logger.log(
      `[contact] yeni mesaj #${saved.id} from=${saved.email} konu="${saved.subject}"`,
    );

    // Mail gönderimi (DB'ye yazma başarılı olduktan SONRA, non-blocking)
    void this.sendInboxNotification(saved).catch((err) => {
      this.logger.error(
        `[contact] mail gönderimi başarısız (mesaj #${saved.id} DB'ye yazıldı): ${err?.message ?? err}`,
      );
    });

    return saved;
  }

  /**
   * info@finanscozum.net'e SMTP üzerinden mail gönderir.
   */
  private async sendInboxNotification(msg: ContactMessage): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(
        `[contact] SMTP transporter yok → mail gönderilmedi (mesaj #${msg.id} sadece DB'de).`,
      );
      return;
    }

    const to = this.config.get<string>('MAIL_TO') ?? 'info@finanscozum.net';
    const from = this.config.get<string>('SMTP_FROM') ?? this.config.get<string>('SMTP_USER') ?? 'noreply@finanscozum.net';

    const subject = `[İletişim Formu] ${msg.subject}`;
    const text = [
      `Yeni iletişim formu mesajı (DB ID: ${msg.id})`,
      ``,
      `Gönderen: ${msg.name} <${msg.email}>`,
      `Konu: ${msg.subject}`,
      `Tarih: ${msg.createdAt.toISOString()}`,
      `IP: ${msg.ipAddress ?? '-'}`,
      `User-Agent: ${msg.userAgent ?? '-'}`,
      ``,
      `--- Mesaj ---`,
      msg.message,
    ].join('\n');

    const html = `
<!doctype html>
<html>
<body style="font-family:system-ui,sans-serif;line-height:1.6;color:#1f2937;max-width:600px;margin:0 auto;padding:24px">
  <h2 style="color:#f59e0b;margin:0 0 16px">Yeni İletişim Formu Mesajı</h2>
  <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
    <tr><td style="padding:4px 8px;color:#6b7280">Gönderen</td><td style="padding:4px 8px"><strong>${escapeHtml(msg.name)}</strong> &lt;<a href="mailto:${escapeHtml(msg.email)}">${escapeHtml(msg.email)}</a>&gt;</td></tr>
    <tr><td style="padding:4px 8px;color:#6b7280">Konu</td><td style="padding:4px 8px"><strong>${escapeHtml(msg.subject)}</strong></td></tr>
    <tr><td style="padding:4px 8px;color:#6b7280">Tarih</td><td style="padding:4px 8px">${msg.createdAt.toISOString()}</td></tr>
    <tr><td style="padding:4px 8px;color:#6b7280">IP</td><td style="padding:4px 8px">${escapeHtml(msg.ipAddress ?? '-')}</td></tr>
  </table>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
  <div style="white-space:pre-wrap;background:#f9fafb;padding:16px;border-radius:8px">${escapeHtml(msg.message)}</div>
  <p style="color:#9ca3af;font-size:12px;margin-top:24px">DB ID: ${msg.id} — bu mesaj <code>contact_messages</code> tablosuna kaydedildi.</p>
</body>
</html>`.trim();

    const info = await this.transporter.sendMail({
      from,
      to,
      replyTo: msg.email, // info@ maili Reply yaparsa form gönderenin adresine gitsin
      subject,
      text,
      html,
    });

    this.logger.log(
      `[contact] mail gönderildi → ${to} (mesaj #${msg.id}, messageId=${info.messageId})`,
    );
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
