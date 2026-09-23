import { api } from './api';
import type { Room, CreateRoomDTO, UpdateRoomDTO, UpdateRoomResponse } from '../types/room';

export const RoomService = {
  /**
   * US01: Creates a new tutorial room.
   * POST /rooms
   */
  createRoom: async (data: CreateRoomDTO): Promise<Room> => {
    const response = await api.post<Room>('/rooms', data);
    return response.data;
  },

  /**
   * US02: Retrieves all tutorial rooms linked to the authenticated professor.
   * GET /rooms
   */
  getRooms: async (): Promise<Room[]> => {
    const response = await api.get<Room[]>('/rooms');
    return response.data;
  },

  /**
   * US02: Retrieves details of a specific room by its ID.
   * GET /rooms/:id
   */
  getRoomById: async (id: string): Promise<Room> => {
    const response = await api.get<Room>(`/rooms/${id}`);
    return response.data;
  },

  /**
   * US03: Updates an existing room.
   * PATCH /rooms/:id
   */
  updateRoom: async (id: string, data: UpdateRoomDTO): Promise<UpdateRoomResponse> => {
    const response = await api.patch<UpdateRoomResponse>(`/rooms/${id}`, data);
    return response.data;
  },

  /**
   * US04: Deletes a tutorial room.
   * DELETE /rooms/:id
   */
  deleteRoom: async (id: string): Promise<void> => {
    await api.delete(`/rooms/${id}`);
  },
};
