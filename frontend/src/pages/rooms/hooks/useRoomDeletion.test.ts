import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { roomService } from '@/services/room.service';
import { ApiError } from '@/services/apiError';
import type { Room } from '@/types/room';
import { useRoomDeletion } from './useRoomDeletion';

const mockNotify = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: mockNotify }),
}));

vi.mock('@/services/room.service', () => ({
  roomService: {
    remove: vi.fn(),
  },
}));

let mockUser: { id: string; nome: string } | null = { id: 'tutor-1', nome: 'Professor Fulano' };
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser }),
}));

const sampleRoomOwner: Room = {
  id: 'room-1',
  nome: 'Turma de Algoritmos',
  codigoDisciplina: 'ALG01',
  codigoSala: 'ALG123',
  semestre: '2026.1',
  ativo: true,
  criadoEm: '2026-01-01T00:00:00.000Z',
  professorResponsavelId: 'tutor-1',
};

const sampleRoomCoTutor: Room = {
  id: 'room-2',
  nome: 'Turma de Banco de Dados',
  codigoDisciplina: 'BD01',
  codigoSala: 'BD123',
  semestre: '2026.1',
  ativo: true,
  criadoEm: '2026-01-01T00:00:00.000Z',
  professorResponsavelId: 'tutor-2',
};

describe('useRoomDeletion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: 'tutor-1', nome: 'Professor Fulano' };
  });

  it('initializes with default values', () => {
    const setRooms = vi.fn();
    const { result } = renderHook(() => useRoomDeletion(setRooms));

    expect(result.current.roomToDelete).toBeNull();
    expect(result.current.isOwner).toBe(true);
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.isDeleting).toBe(false);
  });

  it('determines isOwner correctly when opening delete modal', () => {
    const setRooms = vi.fn();
    const { result } = renderHook(() => useRoomDeletion(setRooms));

    act(() => {
      result.current.onOpenDelete(sampleRoomOwner);
    });
    expect(result.current.roomToDelete).toEqual(sampleRoomOwner);
    expect(result.current.isOwner).toBe(true);

    act(() => {
      result.current.onOpenDelete(sampleRoomCoTutor);
    });
    expect(result.current.roomToDelete).toEqual(sampleRoomCoTutor);
    expect(result.current.isOwner).toBe(false);
  });

  it('resets state on cancel', () => {
    const setRooms = vi.fn();
    const { result } = renderHook(() => useRoomDeletion(setRooms));

    act(() => {
      result.current.onOpenDelete(sampleRoomOwner);
    });
    expect(result.current.roomToDelete).not.toBeNull();

    act(() => {
      result.current.onCancelDelete();
    });
    expect(result.current.roomToDelete).toBeNull();
    expect(result.current.errorMessage).toBeNull();
  });

  it('removes room, triggers success toast and resets modal on successful delete', async () => {
    vi.mocked(roomService.remove).mockResolvedValue(undefined);
    const setRooms = vi.fn();
    const { result } = renderHook(() => useRoomDeletion(setRooms));

    act(() => {
      result.current.onOpenDelete(sampleRoomOwner);
    });

    await act(async () => {
      await result.current.onConfirmDelete();
    });

    expect(roomService.remove).toHaveBeenCalledWith('room-1');
    expect(setRooms).toHaveBeenCalled();
    expect(result.current.roomToDelete).toBeNull();
    expect(mockNotify).toHaveBeenCalledWith({
      tone: 'success',
      message: 'Turma excluída com sucesso!',
    });
  });

  it('sets errorMessage and triggers error toast on failed delete', async () => {
    vi.mocked(roomService.remove).mockRejectedValue(
      new ApiError(403, ['Apenas o professor responsável pode realizar esta ação.']),
    );
    const setRooms = vi.fn();
    const { result } = renderHook(() => useRoomDeletion(setRooms));

    act(() => {
      result.current.onOpenDelete(sampleRoomOwner);
    });

    await act(async () => {
      await result.current.onConfirmDelete();
    });

    expect(result.current.errorMessage).toBe(
      'Apenas o professor responsável pode realizar esta ação.',
    );
    expect(mockNotify).toHaveBeenCalledWith({
      tone: 'error',
      message: 'Apenas o professor responsável pode realizar esta ação.',
    });
  });
});
