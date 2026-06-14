import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Service for persisting uploaded image files to a local uploads directory.
 * The directory is served as a static asset by main.ts at /uploads/*.
 *
 * Recommended image size: 1200x630 (Open Graph / Twitter card standard).
 * Max accepted size: 5 MB.
 * Allowed MIME types: image/jpeg, image/png, image/webp.
 */
@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadRoot: string;
  private readonly publicBaseUrl: string;

  // 5 MB
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024;
  private static readonly ALLOWED_MIME = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ]);
  private static readonly ALLOWED_EXT: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };

  constructor(private readonly config: ConfigService) {
    this.uploadRoot =
      this.config.get<string>('UPLOAD_DIR') || path.join(process.cwd(), 'uploads');
    this.publicBaseUrl =
      this.config.get<string>('PUBLIC_UPLOAD_BASE_URL') ||
      this.config.get<string>('API_PUBLIC_URL') ||
      'https://api.finanscozum.net';
  }

  /**
   * Persist a Multer file to disk and return the public URL.
   * Filename is randomized (uuid) to prevent enumeration and collisions.
   */
  async saveImage(file: Express.Multer.File, subdir = 'thumbnails'): Promise<string> {
    if (!file) {
      throw new BadRequestException('Dosya yüklenmedi');
    }
    if (file.size > UploadService.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `Dosya çok büyük (max ${UploadService.MAX_FILE_SIZE / 1024 / 1024}MB)`,
      );
    }
    if (!UploadService.ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException(
        `Geçersiz dosya tipi: ${file.mimetype} (sadece JPEG, PNG, WebP)`,
      );
    }

    const ext = UploadService.ALLOWED_EXT[file.mimetype];
    const id = crypto.randomBytes(16).toString('hex');
    const filename = `${Date.now()}-${id}.${ext}`;
    const dir = path.join(this.uploadRoot, subdir);
    const filepath = path.join(dir, filename);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filepath, file.buffer);

    const publicUrl = `${this.publicBaseUrl.replace(/\/$/, '')}/uploads/${subdir}/${filename}`;
    this.logger.log(`uploaded: ${publicUrl} (${file.size} bytes)`);
    return publicUrl;
  }
}
