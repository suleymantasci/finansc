import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { tlsOptions } from '../config/tls';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        database: config.get<string>('DB_NAME'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        ssl: config.get<boolean>('DB_SSL')
          ? tlsOptions(config, 'DB')
          : false,
        autoLoadEntities: true,
        synchronize: config.get<string>('NODE_ENV') === 'development',
        // Migration'lar uygulama açılırken otomatik çalışsın (production).
        // migrationsRun=true: uygulanmamış migration'lar DB'ye yazılır.
        // Çalışma zamanı: NestFactory.create() → DB bağlantısı kurulur →
        //   dataSource.runMigrations() otomatik tetiklenir → app.listen().
        migrationsRun: config.get<string>('NODE_ENV') === 'production',
        // Production build'de migrations/ klasörü dist/database/migrations
        // altında JS olarak bulunur (tsc tarafından derlenmiş). Dev'de
        // src/database/migrations altında TS. Her ikisini de tek pattern
        // ile yakalıyoruz.
        // DÜZELTME: __dirname zaten .../database — eski yol .../database/database/migrations
        // idi ve hiçbir migration otomatik çalışmıyordu. dist'te yalnızca .js
        // (.d.ts dosyaları migration sanılmasın), dev'de .ts.
        migrations: [join(__dirname, 'migrations', __filename.endsWith('.ts') ? '*.ts' : '*.js')],
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),
  ],
})
export class DatabaseModule {}
