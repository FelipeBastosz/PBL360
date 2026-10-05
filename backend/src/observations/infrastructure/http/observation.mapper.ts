import type {
  ObservationResponseDto,
  StudentObservationsResponseDto,
} from '../../application/dtos/observation-response.dto';
import type { StudentObservations } from '../../application/use-cases/list-student-observations.use-case';
import type { Observation } from '../../domain/entities/observation.entity';

export function toObservationResponse(observation: Observation): ObservationResponseDto {
  return {
    id: observation.id,
    marcacoes: observation.tags.map((tag) => ({ id: tag.id, nome: tag.name })),
    texto: observation.text,
    criadaEm: observation.createdAt,
  };
}

export function toStudentObservationsResponse(
  result: StudentObservations,
): StudentObservationsResponseDto {
  return {
    observacoes: result.observations.map(toObservationResponse),
    contagem: result.tagCounts,
  };
}
