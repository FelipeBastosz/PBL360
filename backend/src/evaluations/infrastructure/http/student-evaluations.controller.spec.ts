import type { GetSelfAssessmentUseCase } from '../../application/use-cases/get-self-assessment.use-case';
import type { GetStudentEvaluationSummaryUseCase } from '../../application/use-cases/get-student-evaluation-summary.use-case';
import type { SaveSelfAssessmentUseCase } from '../../application/use-cases/save-self-assessment.use-case';
import { StudentEvaluationsController } from './student-evaluations.controller';

describe('StudentEvaluationsController', () => {
  const getSummary = { execute: jest.fn() };
  const getSelfAssessment = { execute: jest.fn() };
  const saveSelfAssessment = { execute: jest.fn() };
  let controller: StudentEvaluationsController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new StudentEvaluationsController(
      getSummary as unknown as GetStudentEvaluationSummaryUseCase,
      getSelfAssessment as unknown as GetSelfAssessmentUseCase,
      saveSelfAssessment as unknown as SaveSelfAssessmentUseCase,
    );
  });

  it('maps the student evaluation summary to the API contract', async () => {
    getSummary.execute.mockResolvedValue({
      self: { released: true, deadline: null, status: 'PENDENTE' },
      peers: { released: false, deadline: null, submitted: 1, total: 2 },
      feedback: { available: true, new: false, tutorEvaluationSubmitted: true },
    });

    await expect(controller.summary('session-1', 'student-1')).resolves.toMatchObject({
      autoavaliacao: { liberada: true, status: 'PENDENTE' },
      pares: { avaliados: 1, total: 2 },
      feedback: {
        disponivel: true,
        novo: false,
        avaliacaoTutorEnviada: true,
      },
    });
  });

  it('maps and forwards the self-assessment form', async () => {
    getSelfAssessment.execute.mockResolvedValue({
      status: 'PENDENTE',
      deadline: null,
      submittedAt: null,
      criteria: [{ id: 'criterion-1', name: 'Participação', weight: 10, maxScore: 10 }],
      items: [],
    });

    await expect(controller.get('session-1', 'student-1')).resolves.toMatchObject({
      status: 'PENDENTE',
      criterios: [{ id: 'criterion-1', nome: 'Participação' }],
    });
    expect(getSelfAssessment.execute).toHaveBeenCalledWith('session-1', 'student-1');
  });

  it('maps and forwards a self-assessment submission', async () => {
    saveSelfAssessment.execute.mockResolvedValue({
      status: 'ENVIADA',
      deadline: null,
      submittedAt: null,
      criteria: [],
      items: [{ criterionId: 'criterion-1', score: 8 }],
    });

    await expect(
      controller.put('session-1', 'student-1', {
        itens: [{ criterioId: 'criterion-1', nota: 8 }],
        enviar: true,
      }),
    ).resolves.toMatchObject({
      status: 'ENVIADA',
      itens: [{ criterioId: 'criterion-1', nota: 8 }],
    });
    expect(saveSelfAssessment.execute).toHaveBeenCalledWith({
      sessionId: 'session-1',
      studentId: 'student-1',
      items: [{ criterionId: 'criterion-1', score: 8 }],
      submit: true,
    });
  });
});
