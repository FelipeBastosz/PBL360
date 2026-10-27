import type { DisciplineResponseDto } from '../../application/dtos/discipline-response.dto';
import type { Discipline } from '../../domain/entities/discipline.entity';

export function toDisciplineResponse(discipline: Discipline): DisciplineResponseDto {
  return {
    id: discipline.id,
    codigo: discipline.code,
    nome: discipline.name,
  };
}
