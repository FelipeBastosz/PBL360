import { join } from 'node:path';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import type { ConfigService } from '@nestjs/config';

export const buildTypeOrmOptions = (config: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: config.getOrThrow<string>('database.host'),
  port: config.getOrThrow<number>('database.port'),
  username: config.getOrThrow<string>('database.username'),
  password: config.getOrThrow<string>('database.password'),
  database: config.getOrThrow<string>('database.database'),
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, '..', 'migrations', '*.{ts,js}')],
  // Never true outside local experiments: migrations are the contract.
  synchronize: config.get<boolean>('database.synchronize') ?? false,
  logging: config.get<boolean>('database.logging') ?? false,
  migrationsRun: false,
  autoLoadEntities: true,
});
