import type { RoomAccessService } from '@/rooms/application/services/room-access.service';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import type {
  GradesRepository,
  ProblemGradeData,
} from '../../domain/repositories/grades.repository';
import { GetProblemGradesUseCase } from './get-problem-grades.use-case';

describe('GetProblemGradesUseCase', () => {
  let useCase: GetProblemGradesUseCase;
  let gradesRepository: jest.Mocked<GradesRepository>;
  let roomAccess: jest.Mocked<Pick<RoomAccessService, 'assertTutorCanAccessRoom'>>;

  const input = {
    roomId: 'room-1',
    problemId: 'problem-1',
    tutorId: 'tutor-1',
  };

  const emptyData: ProblemGradeData = {
    sessions: [],
    students: [],
    formulas: [],
    scores: [],
    attendances: [],
    roles: [],
    criteria: [],
    selfScores: [],
    peerScores: [],
  };

  beforeEach(() => {
    gradesRepository = {
      findProblem: jest.fn(),
      findProblemData: jest.fn().mockResolvedValue(emptyData),
      findFormulaComponents: jest.fn().mockResolvedValue([]),
      saveGrades: jest.fn().mockResolvedValue(undefined),
    };
    roomAccess = {
      assertTutorCanAccessRoom: jest.fn().mockResolvedValue(undefined),
    };

    useCase = new GetProblemGradesUseCase(
      gradesRepository,
      roomAccess as unknown as RoomAccessService,
    );
  });

  it('checks room access before reading the problem', async () => {
    const error = new ForbiddenError('Acesso negado.');
    roomAccess.assertTutorCanAccessRoom.mockRejectedValue(error);

    await expect(useCase.execute(input)).rejects.toBe(error);
    expect(roomAccess.assertTutorCanAccessRoom).toHaveBeenCalledWith(input.roomId, input.tutorId);
    expect(gradesRepository.findProblem).not.toHaveBeenCalled();
  });

  it('throws when the problem does not belong to the room', async () => {
    gradesRepository.findProblem.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toEqual(
      new NotFoundError('Problema não encontrado na sala informada.'),
    );
    expect(gradesRepository.findProblem).toHaveBeenCalledWith(input.problemId, input.roomId);
  });

  it('calculates grades with default formulas and saves them through the repository', async () => {
    gradesRepository.findProblem.mockResolvedValue({
      id: input.problemId,
    });
    gradesRepository.findProblemData.mockResolvedValue({
      ...emptyData,
      sessions: [{ id: 'session-1', date: '2026-10-02' }],
      students: [{ id: 'student-1', name: 'Ana Souza', matricula: '20260001' }],
      scores: [
        {
          session_id: 'session-1',
          student_id: 'student-1',
          criterion_id: 'criterion-1',
          score: 8.5,
        },
      ],
      criteria: [{ id: 'criterion-1', session_id: 'session-1', weight: 1 }],
    });

    const result = await useCase.execute(input);

    expect(result.alunos[0]).toMatchObject({
      alunoId: 'student-1',
      notaFinal: 8.5,
      sessoes: [{ sessaoId: 'session-1', nota: 8.5, situacao: 'AVALIADA' }],
    });
    expect(result.mediaTurma).toBe(8.5);
    expect(gradesRepository.findProblemData).toHaveBeenCalledWith(input.roomId, input.problemId);
    expect(gradesRepository.findFormulaComponents).toHaveBeenCalledWith([]);
    expect(gradesRepository.saveGrades).toHaveBeenCalledWith(input.problemId, {
      sessionRows: [
        {
          session_id: 'session-1',
          student_id: 'student-1',
          grade: 8.5,
          situation: 'AVALIADA',
          formula_version: 1,
        },
      ],
      problemRows: [
        {
          student_id: 'student-1',
          grade: 8.5,
          formula_version: 1,
        },
      ],
    });
  });

  it('uses the versions from active formulas', async () => {
    gradesRepository.findProblem.mockResolvedValue({ id: input.problemId });
    gradesRepository.findProblemData.mockResolvedValue({
      ...emptyData,
      sessions: [{ id: 'session-1', date: '2026-10-02' }],
      formulas: [
        { id: 'formula-session', scope: 'SESSAO', session_id: 'session-1', version: 3 },
        { id: 'formula-problem', scope: 'PROBLEMA', version: 4 },
      ],
    });

    const result = await useCase.execute(input);

    expect(result.versoesFormula).toEqual({ sessao: 3, problema: 4 });
    expect(gradesRepository.findFormulaComponents).toHaveBeenCalledWith([
      'formula-session',
      'formula-problem',
    ]);
  });

  it('feeds the self and peer components of the final formula from each session', async () => {
    const now = new Date('2026-10-12T12:00:00.000Z');
    gradesRepository.findProblem.mockResolvedValue({ id: input.problemId });
    gradesRepository.findProblemData.mockResolvedValue({
      ...emptyData,
      sessions: [
        {
          id: 'session-1',
          date: '2026-10-02',
          self_eval_released: true,
          self_eval_deadline_ms: Date.parse('2026-10-05T12:00:00.000Z'),
          peer_eval_released: true,
          peer_eval_deadline_ms: Date.parse('2026-10-05T12:00:00.000Z'),
        },
        { id: 'session-2', date: '2026-10-09', self_eval_released: true, peer_eval_released: true },
      ],
      students: [{ id: 'student-1', name: 'Ana Souza', matricula: '20260001' }],
      formulas: [{ id: 'formula-problem', scope: 'PROBLEMA', version: 2 }],
      scores: [
        { session_id: 'session-1', student_id: 'student-1', criterion_id: 'c1', score: '8.5' },
      ],
      attendances: [
        { session_id: 'session-1', student_id: 'student-1', status: 'PRESENT' },
        { session_id: 'session-2', student_id: 'student-1', status: 'PRESENT' },
      ],
      criteria: [{ id: 'c1', session_id: 'session-1', weight: 1 }],
      selfScores: [{ session_id: 'session-1', student_id: 'student-1', score: '9.00' }],
      peerScores: [
        { session_id: 'session-1', student_id: 'student-1', score: '8.00' },
        { session_id: 'session-1', student_id: 'student-1', score: '6.00' },
      ],
    });
    gradesRepository.findFormulaComponents.mockResolvedValue([
      { formula_id: 'formula-problem', type: 'MEDIA_SESSOES', weight: '60' },
      { formula_id: 'formula-problem', type: 'AUTOAVALIACAO', weight: '20' },
      { formula_id: 'formula-problem', type: 'PARES', weight: '20' },
    ]);

    const result = await useCase.execute(input, now);

    expect(result.alunos[0]).toMatchObject({
      notaFinal: 8.3,
      autoavaliacao: { nota: 9, situacao: 'AVALIADA' },
      pares: { nota: 7, situacao: 'AVALIADA' },
      sessoes: [
        {
          sessaoId: 'session-1',
          nota: 8.5,
          situacao: 'AVALIADA',
          autoavaliacao: { nota: 9, situacao: 'AVALIADA' },
          pares: { nota: 7, situacao: 'AVALIADA' },
        },
        {
          sessaoId: 'session-2',
          autoavaliacao: { nota: null, situacao: 'PENDENTE' },
          pares: { nota: null, situacao: 'PENDENTE' },
        },
      ],
    });
  });
});
