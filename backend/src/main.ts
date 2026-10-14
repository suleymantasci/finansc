import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { NestExpressApplication } from '@nestjs/platform-express';
import { assertSessionOrigin } from './common/session';

async function bootstrap() {
  // Use the Express-specific factory so we can attach express.static() for
  // serving uploaded images. (NestJS 11 removed the implicit
  // `app.useStaticAssets()` helper — it now lives in the optional
  // `@nestjs/serve-static` package; we don't want to add another dep.)
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableShutdownHooks();
  const config = app.get(ConfigService);

  // Traefik arkasındayız: gerçek istemci IP'si X-Forwarded-For'da. Bu olmadan
  // req.ip her istek için proxy adresi oluyor ve rate limit TÜM ziyaretçiler
  // için tek kova gibi çalışıyordu (dakikada ~100 istekten sonra herkes 429).
  app.set('trust proxy', 1);

  // Security
  app.use(helmet({
    // Allow uploaded images (and other assets) to be loaded cross-origin
    // by the Next.js frontend at https://finanscozum.net
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));
  app.enableCors({
    origin: (config.get<string>('CORS_ORIGIN') ?? '').split(',').map((origin) => origin.trim()).filter(Boolean),
    credentials: true,
  });
  app.use((req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => {
    try { assertSessionOrigin(req, config); next(); }
    catch { res.status(403).json({ message: 'İstek kaynağı doğrulanamadı' }); }
  });

  // Static assets — /uploads/* serves user-uploaded images
  // (used by /api/upload/thumbnail for blog hero/thumbnail storage)
  // Implemented via express.static() so we avoid the @nestjs/serve-static dep.
  const uploadDir = config.get<string>('UPLOAD_DIR') || join(process.cwd(), 'uploads');
  // Ensure the directory exists at boot so the first upload doesn't race
  try {
    mkdirSync(uploadDir, { recursive: true });
  } catch (e) {
    // ignore
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const express = require('express');
  app.use('/uploads', express.static(uploadDir, {
    // Long cache + immutable for content-hashed filenames
    maxAge: '7d',
    fallthrough: false,
  }));

  // Global prefix
  app.setGlobalPrefix('api');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger — dev only
  if (config.get<string>('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('FinansCozum API')
      .setDescription('FinansCozum Backend API Documentation')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  const port = config.get<number>('PORT', 3001);
  await app.listen(port);
  console.log(`🚀 Backend running on http://localhost:${port}`);
  console.log(`📄 Swagger: http://localhost:${port}/docs`);
}

bootstrap();
