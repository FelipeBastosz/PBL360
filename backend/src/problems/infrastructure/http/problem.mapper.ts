import type { ProblemDeletionImpactDto } from '../../application/dtos/problem-deletion-impact.dto';
import type { ProblemPerformanceTableResponseDto } from '../../application/dtos/problem-performance-table-response.dto';
import type { ProblemResponseDto } from '../../application/dtos/problem-response.dto';
import type { ChangeProblemPerformanceTableOutput } from '../../application/use-cases/change-problem-performance-table.use-case';
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
  tabelaId: problem.performanceTableId ?? null,
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

export const toProblemPerformanceTableResponse = (
  change: ChangeProblemPerformanceTableOutput,
): ProblemPerformanceTableResponseDto => ({
  problemaId: change.problemId,
  tabela: { id: change.table.id, nome: change.table.name },
});
