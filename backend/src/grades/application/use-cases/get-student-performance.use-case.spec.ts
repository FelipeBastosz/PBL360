import type { RoomAccessService } from '@/rooms/application/services/room-access.service';
import type { RoomRepository } from '@/rooms/domain/repositories/room.repository';
import type { Problem } from '@/problems/domain/entities/problem.entity';
import type { ProblemRepository } from '@/problems/domain/repositories/problem.repository';
import type { Room } from '@/rooms/domain/entities/room.entity';
import { NotFoundError } from '@/shared/errors/application.error';
import type { GradesRepository } from '../../domain/repositories/grades.repository';
import type { GradesResponseDto } from '../dtos/grades-response.dto';
import type { GetProblemGradesUseCase } from './get-problem-grades.use-case';
import { GetStudentPerformanceUseCase } from './get-student-performance.use-case';

describe('GetStudentPerformanceUseCase', () => {
  const roomId = 'room-1';
  const studentId = 'student-1';
  const tutorId = 'tutor-1';

  const makeProblem = (id: string, title: string, orderIndex = 1): Problem =>
    Object.assign({} as Problem, { id, title, orderIndex });

  const makeGradeResponse = (
    sessions: Array<{
      id: string;
      rotulo: string;
      data: string;
      nota: number | null;
      situacao: string;
      modalidade?: 'TUTOR' | 'AUTOAVALIACAO' | 'PARES';
      paresOrigem?: 'FORMULARIO' | 'PLANNING_POKER';
    }>,
    includeStudent = true,
  ): GradesResponseDto => ({
    sessoes: sessions.map((s) => ({ id: s.id, rotulo: s.rotulo, data: s.data })),
    alunos: includeStudent
      ? [
          {
            alunoId: studentId,
            nome: 'Ana',
            matricula: null,
            sessoes: sessions.map((s) => ({
              sessaoId: s.id,
              nota: s.nota,
              situacao: s.situacao,
              modalidade: s.modalidade ?? 'TUTOR',
              autoavaliacao: { nota: null, situacao: 'NAO_LIBERADA' },
              pares: {
                nota: null,
                situacao: 'NAO_LIBERADA',
                ...(s.paresOrigem ? { origem: s.paresOrigem } : {}),
              },
            })),
            notaFinal: 0,
            autoavaliacao: { nota: null, situacao: 'PENDENTE' },
            pares: { nota: null, situacao: 'PENDENTE' },
          },
        ]
      : [],
    mediaTurma: 0,
    versoesFormula: { sessao: null, problema: 1 },
  });

  const makeDeps = () => {
    const roomAccess = {
      assertTutorCanAccessRoom: jest
        .fn()
        .mockResolvedValue(Object.assign({} as Room, { id: roomId, name: 'Turma 1' })),
    };
    const rooms = {
      findStudents: jest.fn().mockResolvedValue([{ id: studentId, name: 'Ana' }]),
    };
    const problems = {
      findByRoomId: jest.fn().mockResolvedValue([makeProblem('problem-1', 'Problema 1')]),
    };
    const details = {
      findStudentSessionDetails: jest.fn().mockResolvedValue([]),
    };
    const grades = { execute: jest.fn() };
    const useCase = new GetStudentPerformanceUseCase(
      roomAccess as unknown as RoomAccessService,
      rooms as unknown as RoomRepository,
      problems as unknown as ProblemRepository,
      details as unknown as GradesRepository,
      grades as unknown as GetProblemGradesUseCase,
    );
    return { roomAccess, rooms, problems, details, grades, useCase };
  };

  it('reuses calculated grades and orders sessions by date before order indexes', async () => {
    const { details, grades, useCase } = makeDeps();
    const earlierSessionId = 'session-early';
    const laterSessionId = 'session-late';

    grades.execute.mockResolvedValue(
      makeGradeResponse([
        {
          id: laterSessionId,
          rotulo: 'Sessão posterior',
          data: '02-10-2026',
          nota: 0,
          situacao: 'AVALIADA',
        },
        {
          id: earlierSessionId,
          rotulo: 'Sessão anterior',
          data: '01-10-2026',
          nota: null,
          situacao: 'PENDENTE',
        },
      ]),
    );
    details.findStudentSessionDetails.mockResolvedValue([
      {
        sessionId: laterSessionId,
        attendance: 'PRESENT',
        marks: [{ id: 'tag-1', name: 'Colaboração', quantity: 2 }],
        date: '2026-10-02',
        problemOrderIndex: 1,
        sessionOrderIndex: 1,
      },
      {
        sessionId: earlierSessionId,
        attendance: null,
        marks: [],
        date: '2026-10-01',
        problemOrderIndex: 1,
        sessionOrderIndex: 2,
      },
    ]);

    const response = await useCase.execute({ roomId, studentId, tutorId });

    expect(response.sessoes).toEqual([
      expect.objectContaining({
        sessaoId: earlierSessionId,
        nota: null,
        situacao: 'PENDENTE',
      }),
      expect.objectContaining({
        sessaoId: laterSessionId,
        nota: 0,
        situacao: 'AVALIADA',
        presenca: 'PRESENTE',
        marcacoes: [{ id: 'tag-1', nome: 'Colaboração', quantidade: 2 }],
      }),
    ]);
    expect(grades.execute).toHaveBeenCalledWith({
      roomId,
      problemId: 'problem-1',
      tutorId,
    });
  });

  it('breaks same-date ties by problemOrderIndex, sessionOrderIndex and sessionId', async () => {
    const { problems, details, grades, useCase } = makeDeps();
    problems.findByRoomId.mockResolvedValue([
      makeProblem('problem-2', 'Problema 2', 2),
      makeProblem('problem-1', 'Problema 1', 1),
    ]);
    grades.execute
      .mockResolvedValueOnce(
        makeGradeResponse([
          { id: 'p2-s1', rotulo: 'P2 S1', data: '02-10-2026', nota: 7, situacao: 'AVALIADA' },
        ]),
      )
      .mockResolvedValueOnce(
        makeGradeResponse([
          {
            id: 'p1-s2',
            rotulo: 'P1 S2',
            data: '02-10-2026',
            nota: 8,
            situacao: 'AVALIADA',
            modalidade: 'AUTOAVALIACAO',
          },
          {
            id: 'p1-s1',
            rotulo: 'P1 S1',
            data: '02-10-2026',
            nota: 9,
            situacao: 'AVALIADA',
            modalidade: 'PARES',
          },
        ]),
      );
    details.findStudentSessionDetails.mockResolvedValue([
      {
        sessionId: 'p2-s1',
        attendance: 'LATE',
        marks: [],
        date: '2026-10-02',
        problemOrderIndex: 2,
        sessionOrderIndex: 1,
      },
      {
        sessionId: 'p1-s2',
        attendance: 'EXCUSED',
        marks: [],
        date: '2026-10-02',
        problemOrderIndex: 1,
        sessionOrderIndex: 2,
      },
      {
        sessionId: 'p1-s1',
        attendance: 'ABSENT',
        marks: [],
        date: '2026-10-02',
        problemOrderIndex: 1,
        sessionOrderIndex: 1,
      },
    ]);

    const response = await useCase.execute({ roomId, studentId, tutorId });

    expect(response.sessoes.map((s) => s.sessaoId)).toEqual(['p1-s1', 'p1-s2', 'p2-s1']);
    expect(response.sessoes.map((s) => s.presenca)).toEqual(['AUSENTE', 'JUSTIFICADO', 'ATRASADO']);
    expect(response.sessoes.map((s) => s.modalidade)).toEqual(['PARES', 'AUTOAVALIACAO', 'TUTOR']);
  });

  it('exposes PLANNING_POKER modality when peer grade origin is PLANNING_POKER', async () => {
    const { details, grades, useCase } = makeDeps();
    grades.execute.mockResolvedValue(
      makeGradeResponse([
        {
          id: 'poker-s1',
          rotulo: 'Sessão Poker',
          data: '02-10-2026',
          nota: 8.4,
          situacao: 'AVALIADA',
          modalidade: 'PARES',
          paresOrigem: 'PLANNING_POKER',
        },
        {
          id: 'form-s2',
          rotulo: 'Sessão Pares',
          data: '03-10-2026',
          nota: 7.5,
          situacao: 'AVALIADA',
          modalidade: 'PARES',
          paresOrigem: 'FORMULARIO',
        },
      ]),
    );
    details.findStudentSessionDetails.mockResolvedValue([
      {
        sessionId: 'poker-s1',
        attendance: 'PRESENT',
        marks: [],
        date: '2026-10-02',
        problemOrderIndex: 1,
        sessionOrderIndex: 1,
      },
      {
        sessionId: 'form-s2',
        attendance: 'PRESENT',
        marks: [],
        date: '2026-10-03',
        problemOrderIndex: 1,
        sessionOrderIndex: 2,
      },
    ]);

    const response = await useCase.execute({ roomId, studentId, tutorId });

    expect(response.sessoes.map((s) => s.modalidade)).toEqual(['PLANNING_POKER', 'PARES']);
  });

  it('filters calculations and session details when problemId is provided', async () => {
    const { problems, details, grades, useCase } = makeDeps();
    problems.findByRoomId.mockResolvedValue([
      makeProblem('problem-1', 'Problema 1', 1),
      makeProblem('problem-2', 'Problema 2', 2),
    ]);
    grades.execute.mockResolvedValue(
      makeGradeResponse([
        { id: 's-p2', rotulo: 'Sessão P2', data: '03-10-2026', nota: 6.5, situacao: 'AVALIADA' },
      ]),
    );
    details.findStudentSessionDetails.mockResolvedValue([
      {
        sessionId: 's-p2',
        attendance: 'PRESENT',
        marks: [],
        date: '2026-10-03',
        problemOrderIndex: 2,
        sessionOrderIndex: 1,
      },
    ]);

    const response = await useCase.execute({ roomId, studentId, tutorId, problemId: 'problem-2' });

    expect(grades.execute).toHaveBeenCalledTimes(1);
    expect(grades.execute).toHaveBeenCalledWith({ roomId, problemId: 'problem-2', tutorId });
    expect(details.findStudentSessionDetails).toHaveBeenCalledWith(roomId, studentId, [
      'problem-2',
    ]);
    expect(response.sessoes).toHaveLength(1);
    expect(response.sessoes[0]?.problemaId).toBe('problem-2');
  });

  it('returns an empty session list when the room has no problems', async () => {
    const { problems, details, grades, useCase } = makeDeps();
    problems.findByRoomId.mockResolvedValue([]);

    const response = await useCase.execute({ roomId, studentId, tutorId });

    expect(response).toEqual({
      sala: { id: roomId, nome: 'Turma 1' },
      aluno: { id: studentId, nome: 'Ana' },
      sessoes: [],
    });
    expect(grades.execute).not.toHaveBeenCalled();
    expect(details.findStudentSessionDetails).toHaveBeenCalledWith(roomId, studentId, []);
  });

  it('throws NotFoundError when student is not enrolled in the room', async () => {
    const { rooms, grades, useCase } = makeDeps();
    rooms.findStudents.mockResolvedValue([]);

    await expect(useCase.execute({ roomId, studentId, tutorId })).rejects.toThrow(NotFoundError);
    expect(grades.execute).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when problemId does not belong to the room', async () => {
    const { grades, useCase } = makeDeps();

    await expect(
      useCase.execute({ roomId, studentId, tutorId, problemId: 'other-problem' }),
    ).rejects.toThrow(NotFoundError);
    expect(grades.execute).not.toHaveBeenCalled();
  });

  it('throws NotFoundError if student disappears from calculated problem grades', async () => {
    const { grades, useCase } = makeDeps();
    grades.execute.mockResolvedValue(makeGradeResponse([], false));

    await expect(useCase.execute({ roomId, studentId, tutorId })).rejects.toThrow(NotFoundError);
  });
});
