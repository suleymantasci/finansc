import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { join } from 'path';
import { mkdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Security
  app.use(helmet({
    // Allow uploaded images (and other assets) to be loaded cross-origin
    // by the Next.js frontend at https://finanscozum.net
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));
  app.enableCors({
    origin: (config.get<string>('CORS_ORIGIN') ?? '').split(','),
    credentials: true,
  });

  // Static assets — /uploads/* serves user-uploaded images
  // (used by /api/upload/thumbnail for blog hero/thumbnail storage)
  const uploadDir = config.get<string>('UPLOAD_DIR') || join(process.cwd(), 'uploads');
  // Ensure the directory exists at boot so the first upload doesn't race
  try {
    mkdirSync(uploadDir, { recursive: true });
  } catch (e) {
    // ignore
  }
  app.useStaticAssets(uploadDir, { prefix: '/uploads/' });

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
