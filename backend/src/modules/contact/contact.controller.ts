import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { Public } from '../../common/decorators';

@ApiTags('Contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  /**
   * Public endpoint — ziyaretçi login olmadan iletişim formu gönderebilir.
   * Spam'i önlemek için sıkı rate limit (5dk'da max 3 mesaj).
   */
  @Public()
  @Throttle({ default: { limit: 3, ttl: 300000 } })
  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(
    @Body() dto: CreateContactDto,
    @Req() req: Request,
  ): Promise<{ ok: true; id: string }> {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket?.remoteAddress ||
      undefined;
    const userAgent = req.headers['user-agent'] as string | undefined;

    return this.contactService
      .create(dto, { ipAddress, userAgent })
      .then((msg) => ({ ok: true as const, id: msg.id }));
  }
}
