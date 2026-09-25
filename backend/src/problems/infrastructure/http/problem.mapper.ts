import type { ProblemResponseDto } from '../../application/dtos/problem-response.dto';
import type { Problem } from '../../domain/entities/problem.entity';

export const toProblemResponse = (problem: Problem): ProblemResponseDto => ({
  id: problem.id,
  salaId: problem.roomId,
  titulo: problem.title,
  descricao: problem.description ?? null,
  ordem: problem.orderIndex ?? 1,
  dataInicio: problem.startDate ?? null,
  dataFim: problem.endDate ?? null,
  autoavaliacaoLiberada: problem.selfEvalReleased,
  avaliacaoEntreParesLiberada: problem.peerEvalReleased,
  liberadoEm: problem.releasedAt ?? null,
  prazoAutoavaliacao: problem.selfEvalDeadline ?? null,
  criadoPor: problem.createdBy,
  criadoEm: problem.createdAt,
  atualizadoEm: problem.updatedAt,
});
