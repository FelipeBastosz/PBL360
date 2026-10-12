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
      performance_table_id: 'table-1',
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
    expect(gradesRepository.findProblemData).toHaveBeenCalledWith(
      input.roomId,
      input.problemId,
      'table-1',
    );
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
    gradesRepository.findProblem.mockResolvedValue({
      id: input.problemId,
      performance_table_id: 'table-1',
    });
    gradesRepository.findProblemData.mockResolvedValue({
      ...emptyData,
      formulas: [
        { id: 'formula-session', scope: 'SESSAO', version: 3 },
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
});
