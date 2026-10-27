import type {
  SessionEvaluationHistoryItem,
  StudentSessionEvaluationComparison,
} from '../../domain/entities/evaluation-history.entity';
import type { SessionEvaluationHistoryResponseDto } from '../../application/dtos/session-evaluation-history-response.dto';
import type { StudentSessionEvaluationComparisonResponseDto } from '../../application/dtos/student-session-evaluation-comparison-response.dto';

export const toSessionEvaluationHistoryResponse = (
  items: SessionEvaluationHistoryItem[],
): SessionEvaluationHistoryResponseDto => ({
  alunos: items.map((item) => ({
    alunoId: item.alunoId,
    nome: item.nome,
    matricula: item.matricula,
    notaAluno: item.notaAluno,
    notaAlunoOriginal: item.notaAlunoOriginal,
    notaTutor: item.notaTutor,
    notaPares: item.notaPares,
    avaliacoesPares: item.avaliacoesPares,
    situacaoAjuste: item.situacaoAjuste,
  })),
});

const mapComparisonSelfAssessment = (
  autoavaliacao: StudentSessionEvaluationComparison['autoavaliacao'],
) => ({
  status: autoavaliacao.status,
  enviadaEm: autoavaliacao.enviadaEm,
  notaConsolidada: autoavaliacao.notaConsolidada,
  itens: autoavaliacao.itens.map((item) => ({
    criterioId: item.criterioId,
    nome: item.nome,
    notaAluno: item.notaAluno,
    notaTutor: item.notaTutor,
  })),
});

const mapComparisonPeers = (pares: StudentSessionEvaluationComparison['pares']) =>
  pares.map((peer) => ({
    avaliadorId: peer.avaliadorId,
    avaliadorNome: peer.avaliadorNome,
    enviadaEm: peer.enviadaEm,
    notaConsolidada: peer.notaConsolidada,
    itens: peer.itens.map((item) => ({
      criterioId: item.criterioId,
      nota: item.nota,
    })),
  }));

const mapComparisonAdjustments = (ajustes: StudentSessionEvaluationComparison['ajustes']) =>
  ajustes.map((adjustment) => ({
    valorAnterior: adjustment.valorAnterior,
    valorNovo: adjustment.valorNovo,
    justificativa: adjustment.justificativa,
    autor: {
      id: adjustment.autor.id,
      nome: adjustment.autor.nome,
    },
    ajustadoEm: adjustment.ajustadoEm,
  }));

export const toStudentSessionEvaluationComparisonResponse = (
  comparison: StudentSessionEvaluationComparison,
): StudentSessionEvaluationComparisonResponseDto => ({
  aluno: {
    alunoId: comparison.aluno.alunoId,
    nome: comparison.aluno.nome,
  },
  autoavaliacao: mapComparisonSelfAssessment(comparison.autoavaliacao),
  pares: mapComparisonPeers(comparison.pares),
  ajustes: mapComparisonAdjustments(comparison.ajustes),
});
