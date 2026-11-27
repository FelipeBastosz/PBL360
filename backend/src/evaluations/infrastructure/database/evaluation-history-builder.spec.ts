import { EvaluationAdjustmentSituation } from '../../domain/entities/evaluation-history.entity';
import {
  buildHistoryStudentItem,
  calculateCriteriaScore,
  calculatePeerAverage,
  calculateTutorScore,
  getInitials,
} from './evaluation-history-builder';

describe('evaluation-history-builder', () => {
  it('computes initials for full, single-word, and blank names', () => {
    expect(getInitials('Ana Beatriz Souza')).toBe('AS');
    expect(getInitials('Carlos')).toBe('C');
    expect(getInitials('   ')).toBe('');
  });

  it('accepts a plain criteria array as history configuration', () => {
    const item = buildHistoryStudentItem(
      { alunoId: 's-1', nome: 'Ana Souza', matricula: '20240001' },
      [{ id: 'c-1', weight: 1 }],
      {
        selfMap: new Map(),
        adjustmentMap: new Map(),
        peerMap: new Map(),
        tutorMap: new Map([['s-1', [{ criterionId: 'c-1', score: 8 }]]]),
      },
    );

    expect(item).toEqual({
      alunoId: 's-1',
      nome: 'Ana Souza',
      matricula: '20240001',
      notaAluno: null,
      notaAlunoOriginal: null,
      notaTutor: 8,
      notaPares: null,
      avaliacoesPares: 0,
      origem: 'TUTOR',
      situacaoAjuste: EvaluationAdjustmentSituation.SEM_AJUSTE,
    });
  });

  it('exposes the shared score calculations through the history builder', () => {
    const config = {
      criteria: [{ id: 'c-1', weight: 1 }],
      formula: { criteriaWeight: 70, roleWeight: 30 },
    };
    const items = [{ criterionId: 'c-1', score: 8 }];
    expect(calculateCriteriaScore(items, config.criteria)).toBe(8);
    expect(calculatePeerAverage([7, 9])).toBe(8);
    expect(calculateTutorScore(items, config, null)).toBe(8);
  });
});
