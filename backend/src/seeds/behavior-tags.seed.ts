import { Logger } from '@nestjs/common';
import { IsNull } from 'typeorm';
import type { DataSource } from 'typeorm';
import { BehaviorTag } from '@/behavior-tags/domain/entities/behavior-tag.entity';

const logger = new Logger('Seed');

export const SEED_BEHAVIOR_TAGS = [
  'Celular fora de contexto',
  'Atraso',
  'Não participação',
  'Contribuição relevante',
];

export async function seedBehaviorTag(name: string, ds: DataSource): Promise<boolean> {
  const repo = ds.getRepository(BehaviorTag);
  if (await repo.findOneBy({ name, tutorId: IsNull() })) {
    logger.log(`Behavior tag ${name} already exists. Skipping.`);
    return false;
  }

  await repo.save(BehaviorTag.create({ name }));
  logger.log(`Created behavior tag: ${name}`);
  return true;
}

export async function seedAllBehaviorTags(ds: DataSource): Promise<void> {
  for (const name of SEED_BEHAVIOR_TAGS) {
    await seedBehaviorTag(name, ds);
  }
}
