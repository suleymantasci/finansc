import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { tlsOptions } from '../config/tls';

config();

const configService = new ConfigService();
const dbSsl = configService.get<string>('DB_SSL');
const useTls = dbSsl === undefined
  ? configService.get<string>('NODE_ENV') === 'production'
  : dbSsl === 'true';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: configService.get<string>('DB_HOST'),
  port: configService.get<number>('DB_PORT'),
  database: configService.get<string>('DB_NAME'),
  username: configService.get<string>('DB_USERNAME'),
  password: configService.get<string>('DB_PASSWORD'),
  ssl: useTls ? tlsOptions(configService, 'DB') : false,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: configService.get<string>('NODE_ENV') === 'development',
};

export default new DataSource(dataSourceOptions);
