import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactMessage } from './entities/contact-message.entity';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    @InjectRepository(ContactMessage)
    private readonly repo: Repository<ContactMessage>,
  ) {}

  /**
   * Yeni iletişim mesajı kaydeder.
   *
   * Not: Şu an sadece DB'ye yazıyoruz. SMTP / Resend / SendGrid entegrasyonu
   * sonra eklenebilir — bu servis bunu bağımsız yapabilmek için
   * `forwardToInbox` metodu ile ayrılmış.
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

    // TODO: SMTP / Resend / SendGrid entegre edildiğinde burada
    // `this.forwardToInbox(saved)` çağrılacak.
    this.logger.log(
      `[contact] yeni mesaj #${saved.id} from=${saved.email} konu="${saved.subject}"`,
    );

    return saved;
  }

  /**
   * Admin için: tüm mesajları listele (sayfalı).
   * Henüz admin endpoint yok; daha sonra eklenebilir.
   */
  // async findAll(page = 1, limit = 20) { ... }

  /**
   * Gelecekte: mesajı info@finanscozum.net'e SMTP ile gönder.
   * Şu an sadece stub — gerçek mail gitmez, DB kaydı yeterli.
   */
  private async forwardToInbox(_msg: ContactMessage): Promise<void> {
    // implement later: SMTP / Resend API
  }
}
