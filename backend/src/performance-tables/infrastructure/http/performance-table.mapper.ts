import type { CreatePerformanceTableDto } from '../../application/dtos/create-performance-table.dto';
import type { PerformanceTableResponseDto } from '../../application/dtos/performance-table-response.dto';
import type { CreatePerformanceTableInput } from '../../application/use-cases/create-performance-table.use-case';
import type { PerformanceTable } from '../../domain/entities/performance-table.entity';
import type { UpdatePerformanceTableDto } from '../../application/dtos/update-performance-table.dto';
import type { UpdatePerformanceTable } from '../../domain/entities/update-performance-table';

export const toCreatePerformanceTableInput = (
  dto: CreatePerformanceTableDto,
  tutorId: string,
): CreatePerformanceTableInput => ({
  tutorId,
  name: dto.nome,
  description: dto.descricao,
  criteria: dto.criterios.map((criterion) => ({
    name: criterion.nome,
    description: criterion.descricao,
    orderIndex: criterion.ordem,
    weight: criterion.peso,
  })),
});

export const toPerformanceTableResponse = (
  table: PerformanceTable,
): PerformanceTableResponseDto => ({
  id: table.id,
  professorId: table.tutorId,
  nome: table.name,
  isDefault: table.isDefault,
  descricao: table.description,
  quantidadeProblemas: table.problemCount ?? 0,
  quantidadeSessoes: table.sessionCount ?? 0,
  quantidadeSessoesPassadas: table.pastSessionCount ?? 0,
  criterios: mapCriteria(table),
  criadoEm: table.createdAt,
  atualizadoEm: table.updatedAt,
});

function mapCriteria(table: PerformanceTable) {
  return table.criteria.map((criterion) => ({
    id: criterion.id,
    nome: criterion.name,
    descricao: criterion.description,
    ordem: criterion.orderIndex,
    peso: Number(criterion.weight),
  }));
}

export const toUpdatePerformanceTableInput = (
  dto: UpdatePerformanceTableDto,
): UpdatePerformanceTable => ({
  propagateToSessions: dto.propagarParaSessoes ?? false,
  name: dto.nome,
  description: dto.descricao,
  criteria: dto.criterios.map((criterion) => ({
    id: criterion.id,
    name: criterion.nome,
    description: criterion.descricao,
    orderIndex: criterion.ordem,
    weight: criterion.peso,
  })),
});
