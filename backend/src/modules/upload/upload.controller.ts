import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Roles, Public } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { UserRole } from '../users/entities/user.entity';
import { UploadService } from './upload.service';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * Public endpoint — accepts a single image file and returns its public URL.
   * Restricted to admins because the upload becomes the public thumbnail.
   * In a future iteration we may add image resizing / WebP conversion
   * (sharp or jimp) to enforce 1200x630 OG standard.
   */
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('thumbnail')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadThumbnail(@UploadedFile() file: any) {
    try {
      const url = await this.uploadService.saveImage(file, 'thumbnails');
      return { url, size: file.size, mime: file.mimetype };
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException('Yükleme başarısız: ' + (e as Error).message);
    }
  }
}
