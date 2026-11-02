import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { hash } from 'bcrypt';
import type { DataSource, Repository } from 'typeorm';
import dataSource from '@/config/data-source';
import { User } from '@/users/domain/entities/user.entity';
import { UserPhoto } from '@/users/domain/entities/user-photo.entity';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { placeholderPhotoBytes } from './placeholder-photo';
import { seedAllBehaviorTags } from './behavior-tags.seed';
import { seedAllPerformanceTables } from './performance-tables.seed';
import { seedReviewData } from './review.seed';
import { SEED_USERS, type SeedUserData } from './seed-users';

export const DEFAULT_PASSWORD = 'senha-secreta';

const DEFAULT_BCRYPT_ROUNDS = 12;

const logger = new Logger('Seed');

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

async function userAlreadyExists(repo: Repository<User>, data: SeedUserData): Promise<boolean> {
  if (await repo.findOneBy({ email: data.email })) {
    logger.log(`User ${data.email} already exists. Skipping.`);
    return true;
  }
  if (
    data.registrationNumber &&
    (await repo.findOneBy({ registrationNumber: data.registrationNumber }))
  ) {
    logger.log(`User with registration ${data.registrationNumber} already exists. Skipping.`);
    return true;
  }
  return false;
}

export async function seedUser(
  data: SeedUserData,
  pwdHash: string,
  ds: DataSource = dataSource,
): Promise<boolean> {
  const repo = ds.getRepository(User);
  if (await userAlreadyExists(repo, data)) return false;
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
  await seedAllBehaviorTags(ds);
  const studentEmails = SEED_USERS.filter((u) => u.type === UserType.STUDENT).map((u) => u.email);
  await seedReviewData(ds, studentEmails);
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
