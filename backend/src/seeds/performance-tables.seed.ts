import { Logger } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { CriterionCategory } from '@/performance-tables/domain/enums/criterion-category.enum';
import type { NewPerformanceCriterion } from '@/performance-tables/domain/entities/new-performance-table';
import { PerformanceTable } from '@/performance-tables/domain/entities/performance-table.entity';
import { User } from '@/users/domain/entities/user.entity';

export interface SeedPerformanceTableData {
  tutorEmail: string;
  name: string;
  description: string;
  criteria: NewPerformanceCriterion[];
}

const logger = new Logger('Seed');

export const SEED_PERFORMANCE_TABLES: SeedPerformanceTableData[] = [
  {
    tutorEmail: 'carlos@uefs.br',
    name: 'Barema PBL',
    description: 'Critérios padrão do módulo de Algoritmos.',
    criteria: [
      { name: 'Domínio do tema', category: CriterionCategory.CONTENT, weight: 3, maxScore: 10 },
      { name: 'Uso de fontes', category: CriterionCategory.CONTENT, weight: 2, maxScore: 10 },
      { name: 'Contribuição', category: CriterionCategory.PARTICIPATION, weight: 2, maxScore: 10 },
      { name: 'Escuta ativa', category: CriterionCategory.PARTICIPATION, weight: 1, maxScore: 10 },
      { name: 'Pontualidade', category: CriterionCategory.BEHAVIOR, weight: 1, maxScore: 10 },
      { name: 'Postura', category: CriterionCategory.BEHAVIOR, weight: 1, maxScore: 10 },
    ],
  },
  {
    tutorEmail: 'carlos@uefs.br',
    name: 'Avaliação de sessão curta',
    description: 'Versão enxuta para sessões tutoriais rápidas.',
    criteria: [
      { name: 'Domínio do tema', category: CriterionCategory.CONTENT, weight: 3, maxScore: 10 },
      { name: 'Contribuição', category: CriterionCategory.PARTICIPATION, weight: 2, maxScore: 10 },
      { name: 'Postura', category: CriterionCategory.BEHAVIOR, weight: 1, maxScore: 10 },
    ],
  },
];

export async function seedPerformanceTable(
  data: SeedPerformanceTableData,
  ds: DataSource,
): Promise<boolean> {
  const tutor = await ds.getRepository(User).findOneBy({ email: data.tutorEmail });
  if (!tutor) {
    logger.warn(`Tutor ${data.tutorEmail} not found. Skipping table ${data.name}.`);
    return false;
  }

  const repo = ds.getRepository(PerformanceTable);
  if (await repo.findOneBy({ tutorId: tutor.id, name: data.name })) {
    logger.log(`Performance table ${data.name} already exists. Skipping.`);
    return false;
  }

  await repo.save(PerformanceTable.create({ ...data, tutorId: tutor.id }));
  logger.log(`Created performance table: ${data.name}`);
  return true;
}

export async function seedAllPerformanceTables(ds: DataSource): Promise<void> {
  for (const data of SEED_PERFORMANCE_TABLES) {
    await seedPerformanceTable(data, ds);
  }
}
