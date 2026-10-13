import { Inject, Injectable, Optional } from '@nestjs/common';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import type { NewPerformanceCriterion } from '../../domain/entities/new-performance-table';
import { PerformanceTable } from '../../domain/entities/performance-table.entity';
import {
  PERFORMANCE_TABLE_REPOSITORY,
  type PerformanceTableRepository,
} from '../../domain/repositories/performance-table.repository';

export interface CreatePerformanceTableInput {
  tutorId: string;
  roomId?: string | null;
  name: string;
  description?: string | null;
  isDefault?: boolean;
  criteria: NewPerformanceCriterion[];
}

export const DEFAULT_PERFORMANCE_TABLE = {
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
} satisfies Omit<CreatePerformanceTableInput, 'tutorId'>;

@Injectable()
export class CreatePerformanceTableUseCase {
  constructor(
    @Inject(PERFORMANCE_TABLE_REPOSITORY)
    private readonly performanceTableRepository: PerformanceTableRepository,
    @Optional()
    private readonly roomAccessService?: RoomAccessService,
  ) {}

  async execute(input: CreatePerformanceTableInput): Promise<PerformanceTable> {
    if (input.roomId && this.roomAccessService) {
      await this.roomAccessService.assertTutorCanAccessRoom(input.roomId, input.tutorId);
    }

    const table = PerformanceTable.create(input);

    return this.performanceTableRepository.create(table);
  }

  executeDefault(tutorId: string): Promise<PerformanceTable> {
    return this.execute({ ...DEFAULT_PERFORMANCE_TABLE, tutorId });
  }
}
