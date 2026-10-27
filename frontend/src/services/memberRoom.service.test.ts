import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/services/apiError';
import { memberRoomService } from '@/services/memberRoom.service';
import { problemService } from '@/services/problem.service';
import { roomService } from '@/services/room.service';
import { sessionService } from '@/services/session.service';

vi.mock('@/services/room.service');
vi.mock('@/services/problem.service');
vi.mock('@/services/session.service');

const roomSession = (id: string, problemaId: string) => ({
  id,
  titulo: `Sessão ${id}`,
  data: '2026-08-12',
  ordem: 1,
  status: 'agendada',
  problemaId,
  problemaTitulo: 'Problema',
});

describe('memberRoomService', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('reads the room of a tutor from the tutor route', async () => {
    vi.mocked(roomService.getById).mockResolvedValue({ id: 'r1', nome: 'Sala' } as never);

    await expect(memberRoomService.room('r1', true)).resolves.toMatchObject({ nome: 'Sala' });
    expect(roomService.listMyRooms).not.toHaveBeenCalled();
  });

  it('reads the room of a student from their rooms', async () => {
    vi.mocked(roomService.listMyRooms).mockResolvedValue([
      { salaId: 'r1', nome: 'MI - TP01', semestre: '2026.2', totalAlunos: 2 },
    ]);

    await expect(memberRoomService.room('r1', false)).resolves.toEqual({
      id: 'r1',
      nome: 'MI - TP01',
    });
    expect(roomService.getById).not.toHaveBeenCalled();
  });

  it('refuses a room the student is not in', async () => {
    vi.mocked(roomService.listMyRooms).mockResolvedValue([]);

    await expect(memberRoomService.room('r1', false)).rejects.toEqual(
      new ApiError(403, ['Você não faz parte desta turma.']),
    );
  });

  it('finds the problem of a student among the room problems', async () => {
    vi.mocked(problemService.list).mockResolvedValue([{ id: 'p1', titulo: 'Biblioteca' }] as never);

    await expect(memberRoomService.problem('r1', 'p1', false)).resolves.toMatchObject({
      titulo: 'Biblioteca',
    });
    await expect(memberRoomService.problem('r1', 'p2', false)).rejects.toBeInstanceOf(ApiError);
    expect(problemService.getById).not.toHaveBeenCalled();
  });

  it('keeps only the sessions of the problem for a student', async () => {
    vi.mocked(sessionService.listForRoom).mockResolvedValue([
      roomSession('s1', 'p1'),
      roomSession('s2', 'p2'),
    ]);

    const sessions = await memberRoomService.sessions('r1', 'p1', false);

    expect(sessions).toEqual([
      {
        id: 's1',
        titulo: 'Sessão s1',
        descricao: null,
        data: '2026-08-12',
        ordem: 1,
        status: 'agendada',
      },
    ]);
    expect(sessionService.list).not.toHaveBeenCalled();
  });
});
