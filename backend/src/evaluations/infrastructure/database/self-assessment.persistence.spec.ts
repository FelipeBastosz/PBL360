import { lockSessionPerformanceTable } from '@/sessions/infrastructure/database/session-table-lock.persistence';
import { validateEvaluationRules } from '../../application/services/evaluation-rule-validation';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import { freezeSessionConfig } from './session-evaluation-config.persistence';
import { readSelfAssessmentDetail } from './self-assessment.reads';
import { FIND_SELF_EVALUATION } from './evaluation.queries';
import { UPDATE_SELF_SUBMISSION } from './self-assessment.queries';
import { SESSION_CALCULATION_VERSION } from '../../domain/services/session-grade-calculator';
import { recordSelfAssessment } from './self-assessment.persistence';

jest.mock('@/sessions/infrastructure/database/session-table-lock.persistence', () => ({
  lockSessionPerformanceTable: jest.fn(),
}));
jest.mock('../../application/services/evaluation-rule-validation', () => ({
  validateEvaluationRules: jest.fn((work: () => unknown) => work()),
}));
jest.mock('./session-evaluation-config.persistence', () => ({ freezeSessionConfig: jest.fn() }));
jest.mock('./self-assessment.reads', () => ({ readSelfAssessmentDetail: jest.fn() }));

describe('recordSelfAssessment', () => {
  beforeEach(() => jest.clearAllMocks());

  const input = {
    context: { sessionId: 'session-1', problemId: 'problem-1', roomId: 'room-1' },
    studentId: 'student-1',
    items: [{ criterionId: 'criterion-1', score: 8 }],
    submit: false,
  };
  const config = {
    tableId: 'table-1',
    tableName: 'Avaliação',
    frozen: true,
    criteria: [{ id: 'criterion-1', name: 'Critério', description: '', weight: 10, orderIndex: 0 }],
  };

  it('creates a draft for an eligible student and persists its score items', async () => {
    const tx = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ released: true, deadline: null }])
        .mockResolvedValueOnce([{ studentId: 'student-1' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 'evaluation-1' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]),
    };
    const transaction = jest.fn((work: (manager: typeof tx) => unknown) => work(tx));
    const detail = { config, evaluation: null, adjustments: [], papel: null, roleScore: null };
    jest.mocked(freezeSessionConfig).mockResolvedValue(config);
    jest.mocked(readSelfAssessmentDetail).mockResolvedValue(detail);

    await expect(recordSelfAssessment({ transaction } as never, input as never)).resolves.toBe(
      detail,
    );
    expect(lockSessionPerformanceTable).toHaveBeenCalledWith(tx, 'session-1');
    expect(validateEvaluationRules).toHaveBeenCalled();
    expect(tx.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO evaluations'), [
      'student-1',
      'problem-1',
      'session-1',
      'table-1',
    ]);
    expect(tx.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO evaluation_items'), [
      'evaluation-1',
      'criterion-1',
      8,
    ]);
    expect(tx.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE evaluations'), [
      null,
      'student-1',
      expect.any(Date),
      'evaluation-1',
    ]);
  });

  it.each([
    { release: [], attendance: [], error: 'Sessão não encontrada.' },
    {
      release: [{ released: false, deadline: null }],
      attendance: [],
      error: 'A autoavaliação não está liberada.',
    },
    {
      release: [{ released: true, deadline: new Date(Date.now() - 1000) }],
      attendance: [],
      error: 'O prazo para a autoavaliação expirou.',
    },
    {
      release: [{ released: true, deadline: null }],
      attendance: [],
      error: 'Apenas alunos presentes ou atrasados podem se autoavaliar.',
    },
  ])('blocks an ineligible self assessment: $error', async ({ release, attendance, error }) => {
    const tx = {
      query: jest.fn().mockResolvedValueOnce(release).mockResolvedValueOnce(attendance),
    };
    const transaction = jest.fn((work: (manager: typeof tx) => unknown) => work(tx));

    await expect(recordSelfAssessment({ transaction } as never, input as never)).rejects.toThrow(
      error,
    );
    expect(freezeSessionConfig).not.toHaveBeenCalled();
  });

  it('refuses edits after submission and requires a cargo score when a role has a weight', async () => {
    const tx = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ released: true, deadline: null }])
        .mockResolvedValueOnce([{ studentId: 'student-1' }])
        .mockResolvedValueOnce([{ id: 'evaluation-1', status: EvaluationStatus.SUBMITTED }]),
    };
    const transaction = jest.fn((work: (manager: typeof tx) => unknown) => work(tx));
    jest.mocked(freezeSessionConfig).mockResolvedValue(config);
    await expect(recordSelfAssessment({ transaction } as never, input as never)).rejects.toThrow(
      'A autoavaliação já foi enviada e não pode ser alterada.',
    );

    tx.query
      .mockReset()
      .mockResolvedValueOnce([{ released: true, deadline: null }])
      .mockResolvedValueOnce([{ studentId: 'student-1' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'evaluation-2' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    jest.mocked(readSelfAssessmentDetail).mockResolvedValue({
      config: { ...config, formula: { criteriaWeight: 70, roleWeight: 30 } },
      evaluation: null,
      adjustments: [],
      papel: 'Coordenador',
      roleScore: null,
    });
    await expect(
      recordSelfAssessment({ transaction } as never, { ...input, submit: true }),
    ).rejects.toThrow('A nota de cargo é obrigatória para estudantes com papel atribuído.');
  });

  it('reuses a concurrently created evaluation and updates its draft', async () => {
    const tx = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ released: true, deadline: null }])
        .mockResolvedValueOnce([{ studentId: 'student-1' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 'concurrent-evaluation' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]),
    };
    const transaction = jest.fn((work: (manager: typeof tx) => unknown) => work(tx));
    jest.mocked(freezeSessionConfig).mockResolvedValue(config);
    const detail = { config, evaluation: null, adjustments: [], papel: null, roleScore: null };
    jest.mocked(readSelfAssessmentDetail).mockResolvedValue(detail);

    await expect(recordSelfAssessment({ transaction } as never, input as never)).resolves.toBe(
      detail,
    );
    expect(tx.query).toHaveBeenCalledWith(FIND_SELF_EVALUATION, ['session-1', 'student-1']);
    expect(tx.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE evaluations'), [
      null,
      'student-1',
      expect.any(Date),
      'concurrent-evaluation',
    ]);
  });

  it('submits a self assessment using the default formula when the student has no role', async () => {
    const tx = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ released: true, deadline: null }])
        .mockResolvedValueOnce([{ studentId: 'student-1' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 'evaluation-3' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]),
    };
    const transaction = jest.fn((work: (manager: typeof tx) => unknown) => work(tx));
    jest.mocked(freezeSessionConfig).mockResolvedValue(config);
    jest.mocked(readSelfAssessmentDetail).mockResolvedValue({
      config,
      evaluation: null,
      adjustments: [],
      papel: null,
      roleScore: null,
    });

    await recordSelfAssessment({ transaction } as never, { ...input, submit: true });

    expect(tx.query).toHaveBeenCalledWith(UPDATE_SELF_SUBMISSION, [
      expect.any(Date),
      expect.any(Number),
      null,
      SESSION_CALCULATION_VERSION,
      'student-1',
      'evaluation-3',
    ]);
  });

  it('submits with a provided cargo score when the assigned role has weight', async () => {
    const tx = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ released: true, deadline: null }])
        .mockResolvedValueOnce([{ studentId: 'student-1' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 'evaluation-4' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]),
    };
    const transaction = jest.fn((work: (manager: typeof tx) => unknown) => work(tx));
    jest.mocked(freezeSessionConfig).mockResolvedValue(config);
    jest.mocked(readSelfAssessmentDetail).mockResolvedValue({
      config: { ...config, formula: { criteriaWeight: 70, roleWeight: 30 } },
      evaluation: null,
      adjustments: [],
      papel: 'Coordenador',
      roleScore: null,
    });

    await recordSelfAssessment({ transaction } as never, { ...input, submit: true, notaCargo: 9 });

    expect(tx.query).toHaveBeenCalledWith(UPDATE_SELF_SUBMISSION, [
      expect.any(Date),
      expect.any(Number),
      9,
      SESSION_CALCULATION_VERSION,
      'student-1',
      'evaluation-4',
    ]);
  });

  it('allows submitting without a cargo score when the role has no weight', async () => {
    const tx = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ released: true, deadline: null }])
        .mockResolvedValueOnce([{ studentId: 'student-1' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 'evaluation-5' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]),
    };
    const transaction = jest.fn((work: (manager: typeof tx) => unknown) => work(tx));
    jest.mocked(freezeSessionConfig).mockResolvedValue(config);
    jest.mocked(readSelfAssessmentDetail).mockResolvedValue({
      config: { ...config, formula: { criteriaWeight: 100, roleWeight: 0 } },
      evaluation: null,
      adjustments: [],
      papel: 'Coordenador',
      roleScore: null,
    });

    await recordSelfAssessment({ transaction } as never, { ...input, submit: true });

    expect(tx.query).toHaveBeenCalledWith(UPDATE_SELF_SUBMISSION, [
      expect.any(Date),
      expect.any(Number),
      null,
      SESSION_CALCULATION_VERSION,
      'student-1',
      'evaluation-5',
    ]);
  });
});
