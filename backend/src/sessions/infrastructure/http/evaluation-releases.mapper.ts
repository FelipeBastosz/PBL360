import type { EvaluationReleasesResponseDto } from '../../application/dtos/evaluation-releases-response.dto';
import type { EvaluationReleaseDto } from '../../application/dtos/update-evaluation-releases.dto';
import type {
  EvaluationReleaseStatus,
  EvaluationReleasesOutput,
} from '../../application/use-cases/helpers/evaluation-releases.helper';
import type { EvaluationReleaseChange } from '../../domain/entities/evaluation-release';

const toStatusResponse = (status: EvaluationReleaseStatus) => ({
  liberada: status.released,
  prazo: status.deadline,
  enviadas: status.submitted,
  esperadas: status.expected,
});

export const toEvaluationReleasesResponse = (
  output: EvaluationReleasesOutput,
): EvaluationReleasesResponseDto => ({
  autoavaliacao: toStatusResponse(output.self),
  pares: toStatusResponse(output.peer),
  atualizadoEm: output.updatedAt,
  atualizadoPor: output.updatedBy,
});

export const toEvaluationReleaseChange = (
  dto?: EvaluationReleaseDto | null,
): EvaluationReleaseChange | undefined =>
  dto ? { released: dto.liberada, deadline: dto.prazo ? new Date(dto.prazo) : null } : undefined;
