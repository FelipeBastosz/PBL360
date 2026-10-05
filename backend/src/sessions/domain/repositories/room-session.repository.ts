export const ROOM_SESSION_REPOSITORY = Symbol('ROOM_SESSION_REPOSITORY');

export interface RoomSessionSummary {
  id: string;
  title: string;
  date: string;
  orderIndex: number;
  status: string;
  problemId: string;
  problemTitle: string;
}

export interface RoomSessionRepository {
  findByRoom(roomId: string): Promise<RoomSessionSummary[]>;
}
