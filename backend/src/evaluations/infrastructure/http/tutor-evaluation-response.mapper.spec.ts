import { Evaluation } from '../../domain/entities/evaluation.entity';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import { EvaluationStatusResponse } from '../../application/dtos/session-evaluation-summary-response.dto';
import {
  toEvaluationSummaryResponse,
  toTutorEvaluationResponse,
} from './tutor-evaluation-response.mapper';

describe('tutor evaluation response mappers', () => {
  const config = {
    tableId: 'table-1',
    tableName: 'Barema',
    criteria: [{ id: 'c1', name: 'Participação', description: null, weight: 100, orderIndex: 1 }],
    frozen: true,
  };

  it('maps a missing evaluation with fallback config values', () => {
    expect(toTutorEvaluationResponse({ config, evaluation: null, adjustments: [] })).toMatchObject({
      tabela: { id: 'table-1', nome: 'Barema' },
      criterios: [{ id: 'c1', nome: 'Participação', notaMaxima: 10 }],
      status: EvaluationStatusResponse.PENDENTE,
      enviadaEm: null,
      itens: [],
      ajustes: [],
      notaSessao: null,
      adicionalAplicado: null,
      notaCargo: null,
      papel: null,
      formula: { criteriaWeight: 70, roleWeight: 30 },
    });
  });

  it('maps a draft and a submitted evaluation with adjustments and role values', () => {
    const evaluation = Object.assign(new Evaluation(), {
      status: EvaluationStatus.DRAFT,
      submittedAt: null,
      items: [{ criterionId: 'c1', score: 8 }],
      sessionScore: 8,
      appliedBonus: null,
    });
    const adjustment = {
      criterionId: 'c1',
      previousValue: 7,
      newValue: 8,
      justification: 'Revisão',
      authorId: 't1',
      authorName: 'Tutor',
      createdAt: new Date('2025-01-01'),
    };
    expect(
      toTutorEvaluationResponse({
        config: { ...config, formula: { criteriaWeight: 80, roleWeight: 20 } },
        evaluation,
        adjustments: [adjustment],
        papel: 'Líder',
        roleScore: 2,
      }),
    ).toMatchObject({
      status: EvaluationStatusResponse.RASCUNHO,
      itens: [{ criterioId: 'c1', nota: 8 }],
      ajustes: [{ criterioId: 'c1', valorAnterior: 7, valorNovo: 8, autor: { id: 't1' } }],
      adicionalAplicado: 2,
      notaCargo: 2,
      papel: 'Líder',
      formula: { criteriaWeight: 80, roleWeight: 20 },
    });
    evaluation.status = EvaluationStatus.SUBMITTED;
    evaluation.submittedAt = new Date('2025-01-02');
    evaluation.appliedBonus = 3;
    expect(
      toTutorEvaluationResponse({ config, evaluation, adjustments: [], roleScore: 1 }),
    ).toMatchObject({
      status: EvaluationStatusResponse.ENVIADA,
      adicionalAplicado: 3,
      notaCargo: 3,
    });
  });

  it('derives summary initials for single and multi-part names', () => {
    expect(
      toEvaluationSummaryResponse({
        studentId: 's1',
        name: 'ana',
        status: null,
        sessionScore: null,
      }),
    ).toMatchObject({ iniciais: 'A', status: EvaluationStatusResponse.PENDENTE, presenca: null });
    expect(
      toEvaluationSummaryResponse({
        studentId: 's2',
        name: '  Ana Maria Souza ',
        status: EvaluationStatus.DRAFT,
        sessionScore: 9,
      }),
    ).toMatchObject({ iniciais: 'AS', status: EvaluationStatusResponse.RASCUNHO, notaSessao: 9 });
    expect(
      toEvaluationSummaryResponse({
        studentId: 's3',
        name: 'Bia',
        status: EvaluationStatus.SUBMITTED,
        sessionScore: 10,
      }),
    ).toMatchObject({ iniciais: 'B', status: EvaluationStatusResponse.ENVIADA });
  });
});
