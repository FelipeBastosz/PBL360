import {
  toSessionEvaluationHistoryResponse,
  toStudentSessionEvaluationComparisonResponse,
} from './evaluation-history.mapper';
import {
  EvaluationAdjustmentSituation,
  type SessionEvaluationHistoryItem,
  type StudentSessionEvaluationComparison,
} from '../../domain/entities/evaluation-history.entity';

describe('evaluation-history.mapper', () => {
  describe('toSessionEvaluationHistoryResponse', () => {
    it('maps domain items to SessionEvaluationHistoryResponseDto', () => {
      const items: SessionEvaluationHistoryItem[] = [
        {
          alunoId: 'aluno-1',
          nome: 'Ana Souza',
          matricula: '20240001',
          notaAluno: 9.0,
          notaAlunoOriginal: 8.5,
          notaTutor: 9.0,
          notaPares: 8.5,
          avaliacoesPares: 1,
          situacaoAjuste: EvaluationAdjustmentSituation.AJUSTADA,
        },
        {
          alunoId: 'aluno-2',
          nome: 'João Silva',
          matricula: null,
          notaAluno: null,
          notaAlunoOriginal: null,
          notaTutor: null,
          notaPares: null,
          avaliacoesPares: 0,
          situacaoAjuste: EvaluationAdjustmentSituation.SEM_AJUSTE,
        },
      ];

      const response = toSessionEvaluationHistoryResponse(items);

      expect(response).toEqual({
        alunos: [
          {
            alunoId: 'aluno-1',
            nome: 'Ana Souza',
            matricula: '20240001',
            notaAluno: 9.0,
            notaAlunoOriginal: 8.5,
            notaTutor: 9.0,
            notaPares: 8.5,
            avaliacoesPares: 1,
            situacaoAjuste: EvaluationAdjustmentSituation.AJUSTADA,
          },
          {
            alunoId: 'aluno-2',
            nome: 'João Silva',
            matricula: null,
            notaAluno: null,
            notaAlunoOriginal: null,
            notaTutor: null,
            notaPares: null,
            avaliacoesPares: 0,
            situacaoAjuste: EvaluationAdjustmentSituation.SEM_AJUSTE,
          },
        ],
      });
    });
  });

  describe('toStudentSessionEvaluationComparisonResponse', () => {
    it('maps domain comparison to StudentSessionEvaluationComparisonResponseDto', () => {
      const now = new Date();
      const comparison: StudentSessionEvaluationComparison = {
        aluno: { alunoId: 'aluno-1', nome: 'Ana Souza' },
        autoavaliacao: {
          status: 'ENVIADA',
          enviadaEm: now,
          notaConsolidada: 8.5,
          itens: [
            {
              criterioId: 'crit-1',
              nome: 'Domínio do Conteúdo',
              notaAluno: 8.5,
              notaTutor: 9.0,
            },
          ],
        },
        pares: [
          {
            avaliadorId: 'aluno-2',
            avaliadorNome: 'João Silva',
            enviadaEm: now,
            notaConsolidada: 8.5,
            itens: [{ criterioId: 'crit-1', nota: 8.5 }],
          },
        ],
        ajustes: [
          {
            valorAnterior: 8.5,
            valorNovo: 9.0,
            justificativa: 'Participação ativa e consistente.',
            autor: { id: 'tutor-1', nome: 'Carlos Mendes' },
            ajustadoEm: now,
          },
        ],
      };

      const response = toStudentSessionEvaluationComparisonResponse(comparison);

      expect(response).toEqual({
        aluno: { alunoId: 'aluno-1', nome: 'Ana Souza' },
        autoavaliacao: {
          status: 'ENVIADA',
          enviadaEm: now,
          notaConsolidada: 8.5,
          itens: [
            {
              criterioId: 'crit-1',
              nome: 'Domínio do Conteúdo',
              notaAluno: 8.5,
              notaTutor: 9.0,
            },
          ],
        },
        pares: [
          {
            avaliadorId: 'aluno-2',
            avaliadorNome: 'João Silva',
            enviadaEm: now,
            notaConsolidada: 8.5,
            itens: [{ criterioId: 'crit-1', nota: 8.5 }],
          },
        ],
        ajustes: [
          {
            valorAnterior: 8.5,
            valorNovo: 9.0,
            justificativa: 'Participação ativa e consistente.',
            autor: { id: 'tutor-1', nome: 'Carlos Mendes' },
            ajustadoEm: now,
          },
        ],
      });
    });
  });
});
