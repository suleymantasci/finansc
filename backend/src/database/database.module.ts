import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';

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
          ? { rejectUnauthorized: false }
          : false,
        autoLoadEntities: true,
        synchronize: config.get<string>('NODE_ENV') === 'development',
        // Migration'lar uygulama açılırken otomatik çalışsın (production).
        // migrationsRun=true: uygulanmamış migration'lar DB'ye yazılır.
        // Çalışma zamanı: NestFactory.create() → DB bağlantısı kurulur →
        //   dataSource.runMigrations() otomatik tetiklenir → app.listen().
        migrationsRun: config.get<string>('NODE_ENV') === 'production',
        // Production build'de migrations/ klasörü dist/ altında JS olarak
        // bulunur (tsc tarafından derlenmiş), dev'de TS. Pattern her iki
        // uzantıyı da yakalar.
        migrations: [join(__dirname, 'database', 'migrations', '*.{ts,js}')],
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),
  ],
})
export class DatabaseModule {}
