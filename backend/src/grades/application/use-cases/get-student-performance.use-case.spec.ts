import type { RoomAccessService } from '@/rooms/application/services/room-access.service';
import type { RoomRepository } from '@/rooms/domain/repositories/room.repository';
import type { Problem } from '@/problems/domain/entities/problem.entity';
import type { ProblemRepository } from '@/problems/domain/repositories/problem.repository';
import type { Room } from '@/rooms/domain/entities/room.entity';
import type { GradesRepository } from '../../domain/repositories/grades.repository';
import type { GradesResponseDto } from '../dtos/grades-response.dto';
import type { GetProblemGradesUseCase } from './get-problem-grades.use-case';
import { GetStudentPerformanceUseCase } from './get-student-performance.use-case';

describe('GetStudentPerformanceUseCase', () => {
  it('reuses calculated grades and orders sessions by date before order indexes', async () => {
    const problemId = 'problem-1';
    const studentId = 'student-1';
    const earlierSessionId = 'session-early';
    const laterSessionId = 'session-late';
    const gradeResponse: GradesResponseDto = {
      sessoes: [
        { id: laterSessionId, rotulo: 'Sessão posterior', data: '02-10-2026' },
        { id: earlierSessionId, rotulo: 'Sessão anterior', data: '01-10-2026' },
      ],
      alunos: [
        {
          alunoId: studentId,
          nome: 'Ana',
          matricula: null,
          sessoes: [
            {
              sessaoId: laterSessionId,
              nota: 0,
              situacao: 'AVALIADA',
              modalidade: 'TUTOR',
              autoavaliacao: { nota: null, situacao: 'NAO_LIBERADA' },
              pares: { nota: null, situacao: 'NAO_LIBERADA' },
            },
            {
              sessaoId: earlierSessionId,
              nota: null,
              situacao: 'PENDENTE',
              modalidade: 'TUTOR',
              autoavaliacao: { nota: null, situacao: 'NAO_LIBERADA' },
              pares: { nota: null, situacao: 'NAO_LIBERADA' },
            },
          ],
          notaFinal: 0,
          autoavaliacao: { nota: null, situacao: 'PENDENTE' },
          pares: { nota: null, situacao: 'PENDENTE' },
        },
      ],
      mediaTurma: 0,
      versoesFormula: { sessao: null, problema: 1 },
    };
    const problem = Object.assign({} as Problem, {
      id: problemId,
      title: 'Problema 1',
    });
    const roomAccess = {
      assertTutorCanAccessRoom: jest
        .fn()
        .mockResolvedValue(Object.assign({} as Room, { id: 'room-1', name: 'Turma 1' })),
    };
    const rooms = {
      findStudents: jest.fn().mockResolvedValue([{ id: studentId, name: 'Ana' }]),
    };
    const problems = { findByRoomId: jest.fn().mockResolvedValue([problem]) };
    const details = {
      findStudentSessionDetails: jest.fn().mockResolvedValue([
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
      ]),
    };
    const grades = { execute: jest.fn().mockResolvedValue(gradeResponse) };
    const useCase = new GetStudentPerformanceUseCase(
      roomAccess as unknown as RoomAccessService,
      rooms as unknown as RoomRepository,
      problems as unknown as ProblemRepository,
      details as unknown as GradesRepository,
      grades as unknown as GetProblemGradesUseCase,
    );

    const response = await useCase.execute({
      roomId: 'room-1',
      studentId,
      tutorId: 'tutor-1',
    });

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
      roomId: 'room-1',
      problemId,
      tutorId: 'tutor-1',
    });
  });
});
