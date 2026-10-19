import type { RoomAccessService } from '@/rooms/application/services/room-access.service';
import type {
  RoomRepository,
  RoomStudentSummary,
} from '@/rooms/domain/repositories/room.repository';
import type { ProblemRepository } from '@/problems/domain/repositories/problem.repository';
import { Room } from '@/rooms/domain/entities/room.entity';
import { Problem } from '@/problems/domain/entities/problem.entity';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { GetClassFinalReportUseCase } from './get-class-final-report.use-case';
import type { GetProblemGradesUseCase } from './get-problem-grades.use-case';
import type { GradesResponseDto } from '../dtos/grades-response.dto';

describe('GetClassFinalReportUseCase', () => {
  let useCase: GetClassFinalReportUseCase;
  let roomAccess: jest.Mocked<RoomAccessService>;
  let roomRepository: jest.Mocked<RoomRepository>;
  let problemRepository: jest.Mocked<ProblemRepository>;
  let getProblemGrades: jest.Mocked<GetProblemGradesUseCase>;

  const input = {
    roomId: 'room-1',
    tutorId: 'tutor-1',
  };

  const mockRoom = Object.assign(new Room(), {
    id: 'room-1',
    name: 'Turma A - Medicina 2026.2',
    courseCode: 'MED101',
    semester: '2026.2',
    tutorId: 'tutor-1',
  });

  const studentAna: RoomStudentSummary = {
    id: 'student-1',
    name: 'Ana Souza',
    email: 'ana@uefs.br',
    registrationNumber: '20260001',
    joinedAt: new Date('2026-03-01'),
  };

  const studentBruno: RoomStudentSummary = {
    id: 'student-2',
    name: 'Bruno Lima',
    email: 'bruno@uefs.br',
    registrationNumber: '20260002',
    joinedAt: new Date('2026-03-02'),
  };

  const problem1 = Object.assign(new Problem(), {
    id: 'problem-1',
    roomId: 'room-1',
    title: 'Problema 1 - Dor Torácica',
    orderIndex: 1,
  });

  const problem2 = Object.assign(new Problem(), {
    id: 'problem-2',
    roomId: 'room-1',
    title: 'Problema 2 - Dispneia',
    orderIndex: 2,
  });

  const problem3 = Object.assign(new Problem(), {
    id: 'problem-3',
    roomId: 'room-1',
    title: 'Problema 3 - Cefaleia',
    orderIndex: 3,
  });

  const buildGradeReport = (
    studentGrades: Array<{ alunoId: string; notaFinal: number | null }>,
  ): GradesResponseDto => ({
    sessoes: [],
    alunos: studentGrades.map((item) => ({
      alunoId: item.alunoId,
      nome: 'Aluno',
      matricula: null,
      sessoes: [],
      notaFinal: item.notaFinal,
      autoavaliacao: { nota: null, situacao: 'PENDENTE' },
      pares: { nota: null, situacao: 'PENDENTE' },
    })),
    mediaTurma: null,
    versoesFormula: { sessao: null, problema: null },
  });

  beforeEach(() => {
    roomAccess = {
      assertTutorCanAccessRoom: jest.fn().mockResolvedValue(mockRoom),
      assertMemberCanAccessRoom: jest.fn(),
      assertTutorIsRoomOwner: jest.fn(),
    } as unknown as jest.Mocked<RoomAccessService>;

    roomRepository = {
      findStudents: jest.fn().mockResolvedValue([studentAna, studentBruno]),
    } as unknown as jest.Mocked<RoomRepository>;

    problemRepository = {
      findByRoomId: jest.fn().mockResolvedValue([problem1, problem2]),
    } as unknown as jest.Mocked<ProblemRepository>;

    getProblemGrades = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetProblemGradesUseCase>;

    useCase = new GetClassFinalReportUseCase(
      roomAccess,
      roomRepository,
      problemRepository,
      getProblemGrades,
    );
  });

  it('calculates simple general average and sets isParcial to false when all grades are available', async () => {
    getProblemGrades.execute
      .mockResolvedValueOnce(
        buildGradeReport([
          { alunoId: 'student-1', notaFinal: 8.0 },
          { alunoId: 'student-2', notaFinal: 7.0 },
        ]),
      )
      .mockResolvedValueOnce(
        buildGradeReport([
          { alunoId: 'student-1', notaFinal: 6.0 },
          { alunoId: 'student-2', notaFinal: 9.0 },
        ]),
      );

    const result = await useCase.execute(input);

    expect(result.sala).toEqual({
      id: 'room-1',
      nome: 'Turma A - Medicina 2026.2',
      codigoDisciplina: 'MED101',
      semestre: '2026.2',
    });
    expect(result.problemas).toHaveLength(2);
    expect(result.alunos).toHaveLength(2);

    const ana = result.alunos.find((a) => a.id === 'student-1');
    expect(ana).toBeDefined();
    expect(ana?.notasProblemas).toEqual([
      { problemaId: 'problem-1', notaFinal: 8.0 },
      { problemaId: 'problem-2', notaFinal: 6.0 },
    ]);
    expect(ana?.mediaGeral).toBe(7.0);
    expect(ana?.isParcial).toBe(false);

    const bruno = result.alunos.find((a) => a.id === 'student-2');
    expect(bruno?.mediaGeral).toBe(8.0);
    expect(bruno?.isParcial).toBe(false);
  });

  it('calculates average with available grades and sets isParcial to true when grades are missing', async () => {
    problemRepository.findByRoomId.mockResolvedValue([problem1, problem2, problem3]);
    getProblemGrades.execute
      .mockResolvedValueOnce(buildGradeReport([{ alunoId: 'student-1', notaFinal: 8.0 }]))
      .mockResolvedValueOnce(buildGradeReport([{ alunoId: 'student-1', notaFinal: 6.0 }]))
      .mockResolvedValueOnce(buildGradeReport([{ alunoId: 'student-1', notaFinal: null }]));

    const result = await useCase.execute(input);
    const ana = result.alunos.find((a) => a.id === 'student-1');

    expect(ana?.notasProblemas).toEqual([
      { problemaId: 'problem-1', notaFinal: 8.0 },
      { problemaId: 'problem-2', notaFinal: 6.0 },
      { problemaId: 'problem-3', notaFinal: null },
    ]);
    expect(ana?.mediaGeral).toBe(7.0);
    expect(ana?.isParcial).toBe(true);
  });

  it('includes zero grades in calculation and reduces the general average with isParcial false', async () => {
    getProblemGrades.execute
      .mockResolvedValueOnce(buildGradeReport([{ alunoId: 'student-1', notaFinal: 8.0 }]))
      .mockResolvedValueOnce(buildGradeReport([{ alunoId: 'student-1', notaFinal: 0.0 }]));

    const result = await useCase.execute(input);
    const ana = result.alunos.find((a) => a.id === 'student-1');

    expect(ana?.notasProblemas).toEqual([
      { problemaId: 'problem-1', notaFinal: 8.0 },
      { problemaId: 'problem-2', notaFinal: 0.0 },
    ]);
    expect(ana?.mediaGeral).toBe(4.0);
    expect(ana?.isParcial).toBe(false);
  });

  it('returns mediaGeral as null and isParcial as true when no grades are launched for student', async () => {
    getProblemGrades.execute
      .mockResolvedValueOnce(buildGradeReport([{ alunoId: 'student-1', notaFinal: null }]))
      .mockResolvedValueOnce(buildGradeReport([{ alunoId: 'student-1', notaFinal: null }]));

    const result = await useCase.execute(input);
    const ana = result.alunos.find((a) => a.id === 'student-1');

    expect(ana?.mediaGeral).toBeNull();
    expect(ana?.isParcial).toBe(true);
  });

  it('handles empty classroom with no students', async () => {
    roomRepository.findStudents.mockResolvedValue([]);
    getProblemGrades.execute
      .mockResolvedValueOnce(buildGradeReport([]))
      .mockResolvedValueOnce(buildGradeReport([]));

    const result = await useCase.execute(input);

    expect(result.sala.id).toBe('room-1');
    expect(result.problemas).toHaveLength(2);
    expect(result.alunos).toEqual([]);
  });

  it('handles room with no problems registered', async () => {
    problemRepository.findByRoomId.mockResolvedValue([]);

    const result = await useCase.execute(input);

    expect(result.problemas).toEqual([]);
    expect(result.alunos).toHaveLength(2);
    expect(result.alunos[0]?.notasProblemas).toEqual([]);
    expect(result.alunos[0]?.mediaGeral).toBeNull();
    expect(result.alunos[0]?.isParcial).toBe(true);
    expect(getProblemGrades.execute).not.toHaveBeenCalled();
  });

  it('sorts students alphabetically by name', async () => {
    roomRepository.findStudents.mockResolvedValue([studentBruno, studentAna]);
    getProblemGrades.execute
      .mockResolvedValueOnce(buildGradeReport([]))
      .mockResolvedValueOnce(buildGradeReport([]));

    const result = await useCase.execute(input);

    expect(result.alunos[0]?.id).toBe('student-1');
    expect(result.alunos[0]?.nome).toBe('Ana Souza');
    expect(result.alunos[1]?.id).toBe('student-2');
    expect(result.alunos[1]?.nome).toBe('Bruno Lima');
  });

  it('throws ForbiddenError when tutor does not have permission to access the room', async () => {
    const error = new ForbiddenError('Você não tem permissão para acessar ou modificar esta sala.');
    roomAccess.assertTutorCanAccessRoom.mockRejectedValue(error);

    await expect(useCase.execute(input)).rejects.toBe(error);
    expect(roomAccess.assertTutorCanAccessRoom).toHaveBeenCalledWith('room-1', 'tutor-1');
    expect(roomRepository.findStudents).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when the room is not found', async () => {
    const error = new NotFoundError('Sala não encontrada.');
    roomAccess.assertTutorCanAccessRoom.mockRejectedValue(error);

    await expect(useCase.execute(input)).rejects.toBe(error);
    expect(roomAccess.assertTutorCanAccessRoom).toHaveBeenCalledWith('room-1', 'tutor-1');
    expect(roomRepository.findStudents).not.toHaveBeenCalled();
  });
});
