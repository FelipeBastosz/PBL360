import type { ProblemDeletionImpactDto } from '../../application/dtos/problem-deletion-impact.dto';
import type { ProblemResponseDto } from '../../application/dtos/problem-response.dto';
import type { GetProblemDeletionImpactOutput } from '../../application/use-cases/get-problem-deletion-impact.use-case';
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

export const toProblemDeletionImpactResponse = (
  impact: GetProblemDeletionImpactOutput,
): ProblemDeletionImpactDto => ({
  sessoes: impact.sessions,
  notas: impact.grades,
  feedbacks: impact.feedbacks,
  avaliacoes: impact.evaluations,
});
