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

export async function seedBehaviorTag(nome: string, ds: DataSource): Promise<boolean> {
  const repo = ds.getRepository(BehaviorTag);
  if (await repo.findOneBy({ nome, tutorId: IsNull() })) {
    logger.log(`Behavior tag ${nome} already exists. Skipping.`);
    return false;
  }

  await repo.save(BehaviorTag.create({ nome }));
  logger.log(`Created behavior tag: ${nome}`);
  return true;
}

export async function seedAllBehaviorTags(ds: DataSource): Promise<void> {
  for (const nome of SEED_BEHAVIOR_TAGS) {
    await seedBehaviorTag(nome, ds);
  }
}
