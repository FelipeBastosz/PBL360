import type { MessageResponse } from '@/types/auth';
import type {
  AddTutorToRoomPayload,
  CreateRoomPayload,
  Room,
  UpdateRoomPayload,
} from '@/types/room';
import { api } from './api';

const BASE = '/salas';

export const roomService = {
  list: () => api.get<Room[]>(BASE).then((r) => r.data),

  getById: (roomId: string) => api.get<Room>(`${BASE}/${roomId}`).then((r) => r.data),

  create: (payload: CreateRoomPayload) => api.post<Room>(BASE, payload).then((r) => r.data),

  update: (roomId: string, payload: UpdateRoomPayload) =>
    api.patch<Room>(`${BASE}/${roomId}`, payload).then((r) => r.data),

  remove: (roomId: string) => api.delete<void>(`${BASE}/${roomId}`).then(() => undefined),

  addTutor: (roomId: string, payload: AddTutorToRoomPayload) =>
    api.post<MessageResponse>(`${BASE}/${roomId}/professores`, payload).then((r) => r.data),

  removeTutor: (roomId: string, tutorId: string) =>
    api.delete<MessageResponse>(`${BASE}/${roomId}/professores/${tutorId}`).then((r) => r.data),
};
