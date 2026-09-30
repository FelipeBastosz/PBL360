import type { CreatePerformanceTableDto } from '../../application/dtos/create-performance-table.dto';
import type { PerformanceTableResponseDto } from '../../application/dtos/performance-table-response.dto';
import type { CreatePerformanceTableInput } from '../../application/use-cases/create-performance-table.use-case';
import type { PerformanceTable } from '../../domain/entities/performance-table.entity';

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
  descricao: table.description,
  criterios: table.criteria.map((criterion) => ({
    id: criterion.id,
    nome: criterion.name,
    descricao: criterion.description,
    ordem: criterion.orderIndex,
    peso: criterion.weight,
  })),
  criadoEm: table.createdAt,
  atualizadoEm: table.updatedAt,
});
