import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';
import { ContactMessage } from './entities/contact-message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContactMessage]),
    HttpModule.register({
      timeout: 15000,
      maxRedirects: 0,
    }),
  ],
  controllers: [ContactController],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactModule {}
