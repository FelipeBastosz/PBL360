import { Inject, Injectable } from '@nestjs/common';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import { NotFoundError, UnprocessableEntityError } from '@/shared/errors/application.error';
import { PerformanceTable } from '../../domain/entities/performance-table.entity';
import {
  PERFORMANCE_TABLE_REPOSITORY,
  type PerformanceTableRepository,
} from '../../domain/repositories/performance-table.repository';

export interface CopyPerformanceTableInput {
  tableId: string;
  tutorId: string;
  roomId?: string;
  name?: string;
}

@Injectable()
export class CopyPerformanceTableUseCase {
  constructor(
    @Inject(PERFORMANCE_TABLE_REPOSITORY) private readonly tables: PerformanceTableRepository,
    private readonly access: RoomAccessService,
  ) {}

  async execute(input: CopyPerformanceTableInput): Promise<PerformanceTable> {
    if (input.roomId) await this.access.assertTutorCanAccessRoom(input.roomId, input.tutorId);
    const source = await this.tables.findById(input.tableId);
    if (!source) throw new NotFoundError('Tabela de desempenho não encontrada.');
    if (!source.isDefault)
      throw new UnprocessableEntityError('Selecione uma tabela padrão do sistema para copiar.');
    return this.tables.create(createCopy(source, input));
  }
}

function createCopy(source: PerformanceTable, input: CopyPerformanceTableInput): PerformanceTable {
  return PerformanceTable.create({
    tutorId: input.tutorId,
    roomId: input.roomId,
    name: input.name ?? `${source.name} — cópia`,
    description: source.description,
    criteria: source.criteria.map((criterion) => ({
      name: criterion.name,
      description: criterion.description,
      orderIndex: criterion.orderIndex,
      weight: Number(criterion.weight),
    })),
  });
}
