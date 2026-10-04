import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { hash } from 'bcrypt';
import type { DataSource } from 'typeorm';
import dataSource from '@/config/data-source';
import { User } from '@/users/domain/entities/user.entity';
import { UserPhoto } from '@/users/domain/entities/user-photo.entity';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { placeholderPhotoBytes } from './placeholder-photo';
import { seedAllPerformanceTables } from './performance-tables.seed';
import { seedReviewData } from './review.seed';

export interface SeedUserData {
  name: string;
  email: string;
  type: UserType;
  registrationNumber?: string;
}

export const DEFAULT_PASSWORD = 'senha-secreta';

const DEFAULT_BCRYPT_ROUNDS = 12;

const logger = new Logger('Seed');

export const SEED_USERS: SeedUserData[] = [
  {
    name: 'Carlos Mendes',
    email: 'carlos@uefs.br',
    type: UserType.TUTOR,
  },
  {
    name: 'Maria Santos',
    email: 'maria@uefs.br',
    type: UserType.TUTOR,
  },
  {
    name: 'Ana Souza',
    email: '20240001@discente.uefs.br',
    type: UserType.STUDENT,
    registrationNumber: '20240001',
  },
  {
    name: 'João Silva',
    email: '20240002@discente.uefs.br',
    type: UserType.STUDENT,
    registrationNumber: '20240002',
  },
];

function buildSeedUser(data: SeedUserData, pwdHash: string): User {
  const user = User.create({
    name: data.name,
    email: data.email,
    passwordHash: pwdHash,
    type: data.type,
    registrationNumber: data.registrationNumber ?? null,
    photo: data.type === UserType.STUDENT ? UserPhoto.fromBytes(placeholderPhotoBytes()) : null,
  });
  user.activate();

  return user;
}

export async function seedUser(
  data: SeedUserData,
  pwdHash: string,
  ds: DataSource = dataSource,
): Promise<boolean> {
  const repo = ds.getRepository(User);
  if (await repo.findOneBy({ email: data.email })) {
    logger.log(`User ${data.email} already exists. Skipping.`);
    return false;
  }
  const user = buildSeedUser(data, pwdHash);
  const saved = await repo.save(user);
  if (user.pendingPhoto) {
    await ds.getRepository(UserPhoto).save(Object.assign(user.pendingPhoto, { userId: saved.id }));
  }
  logger.log(`Created ${data.type} user: ${data.email}`);
  return true;
}

export function assertSeedAllowed(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV === 'production') {
    throw new Error(
      'The seed creates accounts with a known password and never runs in production.',
    );
  }
}

async function hashSeedPassword(env: NodeJS.ProcessEnv): Promise<string> {
  const rounds = parseInt(env.BCRYPT_ROUNDS ?? String(DEFAULT_BCRYPT_ROUNDS), 10);

  return hash(env.SEED_PASSWORD ?? DEFAULT_PASSWORD, rounds);
}

async function seedAllUsers(ds: DataSource, env: NodeJS.ProcessEnv): Promise<void> {
  const passwordHash = await hashSeedPassword(env);
  for (const data of SEED_USERS) {
    await seedUser(data, passwordHash, ds);
  }
}

async function executeSeeds(ds: DataSource, env: NodeJS.ProcessEnv): Promise<void> {
  await seedAllUsers(ds, env);
  await seedAllPerformanceTables(ds);
  await seedReviewData(ds);
}

export async function runSeed(
  ds: DataSource = dataSource,
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  assertSeedAllowed(env);
  logger.log('Starting database seed...');
  const initializedHere = !ds.isInitialized;
  if (initializedHere) {
    await ds.initialize();
  }
  try {
    await executeSeeds(ds, env);
  } finally {
    if (initializedHere) {
      await ds.destroy();
    }
  }
  logger.log('Database seed completed successfully.');
}

if (require.main === module) {
  runSeed().catch((error: unknown) => {
    logger.error('Error seeding database', error instanceof Error ? error.stack : error);
    process.exit(1);
  });
}
