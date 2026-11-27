import { calculateProblemGrades } from '@/grades/application/services/problem-grade-calculation';
import {
  readFormulaComponents,
  readProblemGradeData,
} from '@/grades/infrastructure/database/problem-grade-data.reads';
import { readReceivedFeedbackGrades } from './received-feedback-grades.reads';

jest.mock('@/grades/application/services/problem-grade-calculation', () => ({
  calculateProblemGrades: jest.fn(),
}));
jest.mock('@/grades/infrastructure/database/problem-grade-data.reads', () => ({
  readFormulaComponents: jest.fn(),
  readProblemGradeData: jest.fn(),
}));

describe('readReceivedFeedbackGrades', () => {
  const manager = { query: jest.fn() };
  const data = {
    sessions: [{ id: 'session-1' }],
    students: [{ id: 'student-1' }],
    formulas: [{ id: 'formula-1' }],
  };
  const activeSession = {
    sessaoId: 'session-1',
    modalidade: 'AUTOAVALIACAO',
    nota: 7,
    autoavaliacao: { nota: 7, situacao: 'ENVIADA', origem: 'FORMULARIO' },
    pares: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(readProblemGradeData).mockResolvedValue(data as never);
    jest.mocked(readFormulaComponents).mockResolvedValue([]);
  });

  it('does not release grades when there are no submitted tutor evaluations or active non-tutor grades', async () => {
    manager.query.mockResolvedValue([]);
    jest
      .mocked(calculateProblemGrades)
      .mockReturnValue({ response: { alunos: [{ sessoes: [] }] } } as never);

    await expect(
      readReceivedFeedbackGrades(manager as never, 'room-1', 'problem-1', 'student-1'),
    ).resolves.toMatchObject({
      released: false,
      finalScore: null,
      sessions: new Map(),
    });
    expect(readProblemGradeData).toHaveBeenCalledWith(manager, 'room-1', 'problem-1');
  });

  it('releases active self and peer session grades and exposes their components', async () => {
    manager.query.mockResolvedValue([]);
    jest.mocked(calculateProblemGrades).mockReturnValue({
      response: {
        alunos: [
          {
            notaFinal: 8.25,
            sessoes: [
              activeSession,
              {
                sessaoId: 'session-2',
                modalidade: 'PARES',
                nota: 6,
                autoavaliacao: null,
                pares: { nota: 6, situacao: 'ENVIADA', origem: 'PLANNING_POKER' },
              },
              { sessaoId: 'session-3', modalidade: 'TUTOR', nota: 9 },
            ],
          },
        ],
      },
    } as never);

    await expect(
      readReceivedFeedbackGrades(manager as never, 'room-1', 'problem-1', 'student-1'),
    ).resolves.toMatchObject({
      released: true,
      finalScore: 8.25,
      sessions: new Map([
        ['session-1', 7],
        ['session-2', 6],
        ['session-3', 9],
      ]),
      components: new Map([
        [
          'session-1',
          { modalidade: 'AUTOAVALIACAO', autoavaliacao: activeSession.autoavaliacao, pares: null },
        ],
        [
          'session-2',
          {
            modalidade: 'PARES',
            autoavaliacao: null,
            pares: { nota: 6, situacao: 'ENVIADA', origem: 'PLANNING_POKER' },
          },
        ],
      ]),
    });
    expect(calculateProblemGrades).toHaveBeenCalledTimes(2);
    expect(readFormulaComponents).toHaveBeenCalledWith(manager, ['formula-1']);
  });

  it('includes tutor submitted sessions even without active self or peer components', async () => {
    manager.query.mockResolvedValue([{ sessionId: 'session-1' }]);
    jest.mocked(calculateProblemGrades).mockReturnValue({
      response: {
        alunos: [
          { notaFinal: 5, sessoes: [{ sessaoId: 'session-1', modalidade: 'TUTOR', nota: 5 }] },
        ],
      },
    } as never);

    await expect(
      readReceivedFeedbackGrades(manager as never, 'room-1', 'problem-1', 'student-1'),
    ).resolves.toMatchObject({
      released: true,
      finalScore: 5,
      sessions: new Map([['session-1', 5]]),
      components: new Map(),
    });
  });
});
