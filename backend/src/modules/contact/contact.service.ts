import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ContactMessage } from './entities/contact-message.entity';
import { CreateContactDto } from './dto/create-contact.dto';

interface MailPayload {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
}

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  // Docker mailserver (örn. mailcow/mailu/postfix) REST API endpoint'i.
  // Süleyman mailserver'ın API türüne göre .env'de ayarlar:
  //   MAIL_API_URL  — örn. http://mailserver:8080/api/v1
  //   MAIL_API_KEY  — API authentication token
  //   MAIL_TO       — mesajların gönderileceği adres (varsayılan info@finanscozum.net)
  //   MAIL_FROM     — gönderici adres (varsayılan noreply@finanscozum.net)
  // Bu değişkenler boşsa mail GÖNDERILMEZ, sadece DB'ye yazılır (graceful fallback).

  constructor(
    @InjectRepository(ContactMessage)
    private readonly repo: Repository<ContactMessage>,
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Yeni iletişim mesajı kaydeder.
   * 1) DB'ye yazar (her zaman)
   * 2) Mailserver REST API üzerinden info@finanscozum.net'e mail gönderir
   *    (MAIL_API_URL tanımlıysa; hata olursa logla, exception fırlatma).
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

    // Mail gönderimi (DB'ye yazma başarılı olduktan SONRA, non-blocking
    // hata: mail başarısız olursa contact POST'u yine de 201 döner)
    void this.sendInboxNotification(saved).catch((err) => {
      this.logger.error(
        `[contact] mail gönderimi başarısız (mesaj #${saved.id} DB'ye yazıldı): ${err?.message ?? err}`,
      );
    });

    return saved;
  }

  /**
   * info@finanscozum.net'e mail gönderir.
   * Mailserver'ın REST API'si varsa onu kullanır; yoksa SMTP'ye fallback
   * (ileride nodemailer eklenebilir).
   */
  private async sendInboxNotification(msg: ContactMessage): Promise<void> {
    const apiUrl = this.config.get<string>('MAIL_API_URL');
    const apiKey = this.config.get<string>('MAIL_API_KEY');
    const to = this.config.get<string>('MAIL_TO') ?? 'info@finanscozum.net';
    const from = this.config.get<string>('MAIL_FROM') ?? 'noreply@finanscozum.net';

    if (!apiUrl || !apiKey) {
      this.logger.warn(
        `[contact] MAIL_API_URL/MAIL_API_KEY tanımlı değil → mail gönderilmedi (mesaj #${msg.id} sadece DB'de). info@finanscozum.net'e mail gitmesi için .env'e SMTP/MAIL değerlerini ekleyin.`,
      );
      return;
    }

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

    // Mailcow / Mailu / benzer API'ler farklı şema kullanır. En yaygın
    // generic payload:
    const payload: MailPayload = { from, to, subject, text, html };

    try {
      await firstValueFrom(
        this.http.post(apiUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'X-API-Key': apiKey, // Bazı API'ler bunu tercih eder
          },
          timeout: 10000,
        }),
      );
      this.logger.log(`[contact] mail gönderildi → ${to} (mesaj #${msg.id})`);
    } catch (err: any) {
      // 401/404/422: API path'i bu maile uygun değil. Detay logla, exception fırlatma.
      const status = err?.response?.status;
      const body = err?.response?.data;
      this.logger.error(
        `[contact] mail API hatası (status=${status ?? 'n/a'}): ${typeof body === 'string' ? body : JSON.stringify(body)}`,
      );
      throw err;
    }
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
