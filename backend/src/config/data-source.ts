import 'reflect-metadata';
import { join } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { readDatabaseEnv } from './env.config';
import { validateDatabaseEnv } from './env.validation';

loadEnv();
validateDatabaseEnv(process.env);

const { host, port, username, password, database } = readDatabaseEnv();

export default new DataSource({
  type: 'postgres',
  host,
  port,
  username,
  password,
  database,
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, '..', 'migrations', '*.{ts,js}')],
  synchronize: false,
});
