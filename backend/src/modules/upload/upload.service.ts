import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import sharp from 'sharp';

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
   * `file` is typed as any to avoid @types/multer dependency.
   */
  async saveImage(file: any, subdir = 'thumbnails'): Promise<string> {
    if (!file) {
      throw new BadRequestException('Dosya yüklenmedi');
    }
    if (!Buffer.isBuffer(file.buffer) || file.buffer.length === 0 || file.buffer.length > UploadService.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `Dosya çok büyük (max ${UploadService.MAX_FILE_SIZE / 1024 / 1024}MB)`,
      );
    }
    if (!UploadService.ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException(
        `Geçersiz dosya tipi: ${file.mimetype} (sadece JPEG, PNG, WebP)`,
      );
    }

    let image: Buffer;
    try {
      const decoder = sharp(file.buffer, { limitInputPixels: 25000000, failOn: 'warning' });
      const metadata = await decoder.metadata();
      const expectedFormat = file.mimetype === 'image/jpg' ? 'jpeg' : file.mimetype.slice('image/'.length);
      if (metadata.format !== expectedFormat) throw new Error('Image type mismatch');
      image = await decoder.rotate().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 }).toBuffer();
    } catch {
      throw new BadRequestException('Geçerli bir JPEG, PNG veya WebP görseli yükleyin');
    }
    const ext = 'webp';
    const id = crypto.randomBytes(16).toString('hex');
    const filename = `${Date.now()}-${id}.${ext}`;
    const dir = path.join(this.uploadRoot, subdir);
    const filepath = path.join(dir, filename);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filepath, image);

    const publicUrl = `${this.publicBaseUrl.replace(/\/$/, '')}/uploads/${subdir}/${filename}`;
    this.logger.log(`uploaded: ${publicUrl} (${file.size} bytes)`);
    return publicUrl;
  }
}
