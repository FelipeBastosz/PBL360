import { ApiError } from '@/services/apiError';
import { problemService } from '@/services/problem.service';
import { roomService } from '@/services/room.service';
import { sessionService } from '@/services/session.service';
import type { Problem } from '@/types/problem';
import type { Room } from '@/types/room';
import type { MemberSession, RoomSession, Session } from '@/types/session';

export const NOT_A_MEMBER_MESSAGE = 'Você não faz parte desta turma.';

export type RoomHeading = Pick<Room, 'id' | 'nome'>;

export type ProblemHeading = Pick<Problem, 'id' | 'titulo'>;

const toSession = (session: RoomSession): Session => ({
  id: session.id,
  titulo: session.titulo,
  descricao: null,
  data: session.data,
  ordem: session.ordem,
  status: session.status,
});

async function studentRoom(roomId: string): Promise<RoomHeading> {
  const room = (await roomService.listMyRooms()).find((item) => item.salaId === roomId);
  if (!room) throw new ApiError(403, [NOT_A_MEMBER_MESSAGE]);
  return { id: room.salaId, nome: room.nome };
}

async function studentProblem(roomId: string, problemId: string): Promise<ProblemHeading> {
  const problem = (await problemService.list(roomId)).find((item) => item.id === problemId);
  if (!problem) throw new ApiError(404, ['Problema não encontrado.']);
  return problem;
}

async function studentSessions(roomId: string, problemId: string): Promise<Session[]> {
  const sessions = await sessionService.listForRoom(roomId);
  return sessions.filter((session) => session.problemaId === problemId).map(toSession);
}

export const memberRoomService = {
  room: (roomId: string, isProfessor: boolean): Promise<Room | RoomHeading> =>
    isProfessor ? roomService.getById(roomId) : studentRoom(roomId),

  problem: (roomId: string, problemId: string, isProfessor: boolean): Promise<ProblemHeading> =>
    isProfessor ? problemService.getById(roomId, problemId) : studentProblem(roomId, problemId),

  sessions: (roomId: string, problemId: string, isProfessor: boolean): Promise<Session[]> =>
    isProfessor ? sessionService.list(roomId, problemId) : studentSessions(roomId, problemId),

  studentSession: (sessionId: string): Promise<MemberSession> =>
    sessionService.getForMember(sessionId),
};
