import 'reflect-metadata';
import { hash } from 'bcrypt';
import type { DataSource } from 'typeorm';
import dataSource from '@/config/data-source';
import { User } from '@/users/domain/entities/user.entity';
import { UserType } from '@/users/domain/enums/user-type.enum';

export interface SeedUserData {
  name: string;
  email: string;
  type: UserType;
  registrationNumber?: string;
  photoUrl?: string;
}

export const DEFAULT_PASSWORD = 'senha-secreta';

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
    photoUrl: 'https://example.com/photos/ana.png',
  },
  {
    name: 'João Silva',
    email: '20240002@discente.uefs.br',
    type: UserType.STUDENT,
    registrationNumber: '20240002',
    photoUrl: 'https://example.com/photos/joao.png',
  },
];

function buildSeedUser(data: SeedUserData, pwdHash: string): User {
  const user = User.create({
    name: data.name,
    email: data.email,
    passwordHash: pwdHash,
    type: data.type,
    registrationNumber: data.registrationNumber ?? null,
    photoUrl: data.photoUrl ?? null,
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
    console.log(`[SEED] User ${data.email} already exists. Skipping.`);
    return false;
  }
  await repo.save(buildSeedUser(data, pwdHash));
  console.log(`[SEED] Created ${data.type} user: ${data.email}`);
  return true;
}

export async function runSeed(ds: DataSource = dataSource): Promise<void> {
  console.log('[SEED] Starting database seed...');
  let initializedHere = false;
  if (!ds.isInitialized) {
    await ds.initialize();
    initializedHere = true;
  }
  const passwordHash = await hash(DEFAULT_PASSWORD, 12);
  for (const data of SEED_USERS) {
    await seedUser(data, passwordHash, ds);
  }
  if (initializedHere) {
    await ds.destroy();
  }
  console.log('[SEED] Database seed completed successfully.');
}

if (require.main === module) {
  runSeed().catch((error) => {
    console.error('[SEED] Error seeding database:', error);
    process.exit(1);
  });
}
