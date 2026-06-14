import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { envValidationSchema } from './config';
import { DatabaseModule } from './database';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { MarketModule } from './modules/market/market.module';
import { HealthModule } from './modules/health/health.module';
import { BlogModule } from './modules/blog/blog.module';
import { ToolsModule } from './modules/tools/tools.module';
import { AdsModule } from './modules/ads/ads.module';
import { AdminModule } from './modules/admin/admin.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AllExceptionsFilter } from './common/filters';
import { APP_FILTER } from '@nestjs/core';
import { UploadModule } from './modules/upload/upload.module';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: true },
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env['THROTTLE_TTL'] || '60000', 10),
        limit: parseInt(process.env['THROTTLE_LIMIT'] || '100', 10),
      },
    ]),

    // Database
    DatabaseModule,

    // Feature modules
    AuthModule,
    MarketModule,
    HealthModule,
    BlogModule,
    ToolsModule,
    AdsModule,
    AdminModule,
    ReportsModule,
    UploadModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
