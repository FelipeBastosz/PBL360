import { Logger } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import type { NewPerformanceCriterion } from '@/performance-tables/domain/entities/new-performance-table';
import { PerformanceTable } from '@/performance-tables/domain/entities/performance-table.entity';
import { User } from '@/users/domain/entities/user.entity';

export interface SeedPerformanceTableData {
  tutorEmail: string;
  name: string;
  description: string;
  isDefault?: boolean;
  criteria: NewPerformanceCriterion[];
}

const logger = new Logger('Seed');

export const SEED_PERFORMANCE_TABLES: SeedPerformanceTableData[] = [
  {
    tutorEmail: 'carlos@uefs.br',
    name: 'Barema PBL',
    description: 'Critérios padrão do módulo de Algoritmos.',
    isDefault: false,
    criteria: [
      {
        name: 'Domínio do tema',
        description: 'Demonstra domínio sobre o tema estudado.',
        orderIndex: 1,
        weight: 3,
      },
      {
        name: 'Uso de fontes',
        description: 'Utiliza fontes relevantes para fundamentar a discussão.',
        orderIndex: 2,
        weight: 2,
      },
      {
        name: 'Contribuição',
        description: 'Contribui ativamente para a construção coletiva.',
        orderIndex: 3,
        weight: 2,
      },
      {
        name: 'Escuta ativa',
        description: 'Demonstra atenção e consideração pelas contribuições dos colegas.',
        orderIndex: 4,
        weight: 1,
      },
      {
        name: 'Pontualidade',
        description: 'Cumpre os horários e prazos estabelecidos.',
        orderIndex: 5,
        weight: 1,
      },
      {
        name: 'Postura',
        description: 'Mantém postura adequada durante as atividades.',
        orderIndex: 6,
        weight: 1,
      },
    ],
  },
  {
    tutorEmail: 'carlos@uefs.br',
    name: 'Fórmula Padrão',
    description: 'Critérios padrão de avaliação.',
    isDefault: true,
    criteria: [
      {
        name: 'Seguimento',
        description: 'Capacidade de seguir as orientações e metodologia do problema.',
        orderIndex: 1,
        weight: 3,
      },
      {
        name: 'Comportamento',
        description: 'Postura, ética, respeito e cooperação com o grupo.',
        orderIndex: 2,
        weight: 3,
      },
      {
        name: 'Participação',
        description: 'Engajamento ativo nas discussões e na resolução do problema.',
        orderIndex: 3,
        weight: 4,
      },
    ],
  },
  {
    tutorEmail: 'carlos@uefs.br',
    name: 'Avaliação de sessão curta',
    description: 'Versão enxuta para sessões tutoriais rápidas.',
    isDefault: false,
    criteria: [
      {
        name: 'Domínio do tema',
        description: 'Demonstra domínio sobre o tema estudado.',
        orderIndex: 1,
        weight: 3,
      },
      {
        name: 'Contribuição',
        description: 'Contribui ativamente para a construção coletiva.',
        orderIndex: 2,
        weight: 2,
      },
      {
        name: 'Postura',
        description: 'Mantém postura adequada durante as atividades.',
        orderIndex: 3,
        weight: 5,
      },
    ],
  },
  {
    tutorEmail: 'maria@uefs.br',
    name: 'Fórmula Padrão',
    description: 'Critérios padrão de avaliação.',
    isDefault: true,
    criteria: [
      {
        name: 'Seguimento',
        description: 'Capacidade de seguir as orientações e metodologia do problema.',
        orderIndex: 1,
        weight: 3,
      },
      {
        name: 'Comportamento',
        description: 'Postura, ética, respeito e cooperação com o grupo.',
        orderIndex: 2,
        weight: 3,
      },
      {
        name: 'Participação',
        description: 'Engajamento ativo nas discussões e na resolução do problema.',
        orderIndex: 3,
        weight: 4,
      },
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
