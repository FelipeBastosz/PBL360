import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { roomService } from '@/services/room.service';
import type { Room } from '@/types/room';
import { useRoomProblemsModals } from './useRoomProblemsModals';

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: vi.fn() }),
}));

vi.mock('@/services/room.service', () => ({
  roomService: {
    listTutors: vi.fn(),
  },
}));

const mockRoom: Room = {
  id: 'room-1',
  nome: 'Turma de Teste',
  codigoSala: 'aB7kP2x9',
  semestre: '2026.2',
  descricao: '',
  professorResponsavelId: 'owner-1',
};

describe('useRoomProblemsModals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens transfer modal and filters out current owner from eligible tutors', async () => {
    vi.mocked(roomService.listTutors).mockResolvedValue([
      { id: 'owner-1', nome: 'Prof. Titular', email: 'owner@test.com', responsavel: true },
      { id: 'tutor-2', nome: 'Profa. Santos', email: 'santos@test.com', responsavel: false },
    ]);

    const setRoom = vi.fn();
    const setProblems = vi.fn();
    const { result } = renderHook(() =>
      useRoomProblemsModals('room-1', 'owner-1', setRoom, setProblems),
    );

    await act(async () => {
      await result.current.handleTransferClick();
    });

    expect(result.current.isTransferOpen).toBe(true);
    expect(result.current.eligibleTutors).toEqual([
      { id: 'tutor-2', nome: 'Profa. Santos', email: 'santos@test.com', responsavel: false },
    ]);
  });

  it('transitions to invite sheet on professores tab when startInviteCoTutor is called', () => {
    const setRoom = vi.fn();
    const setProblems = vi.fn();
    const { result } = renderHook(() =>
      useRoomProblemsModals('room-1', 'owner-1', setRoom, setProblems),
    );

    act(() => {
      result.current.startInviteCoTutor();
    });

    expect(result.current.isTransferOpen).toBe(false);
    expect(result.current.isInviteOpen).toBe(true);
    expect(result.current.inviteTab).toBe('professores');
  });

  it('resumes transfer modal after adding a tutor', async () => {
    vi.mocked(roomService.listTutors).mockResolvedValue([
      { id: 'owner-1', nome: 'Prof. Titular', email: 'owner@test.com', responsavel: true },
      { id: 'tutor-3', nome: 'Novo Professor', email: 'novo@test.com', responsavel: false },
    ]);

    const setRoom = vi.fn();
    const setProblems = vi.fn();
    const { result } = renderHook(() =>
      useRoomProblemsModals('room-1', 'owner-1', setRoom, setProblems),
    );

    act(() => {
      result.current.startInviteCoTutor();
    });

    await act(async () => {
      result.current.handleTutorAdded();
    });

    expect(result.current.isInviteOpen).toBe(false);
    expect(result.current.isTransferOpen).toBe(true);
    expect(result.current.eligibleTutors).toHaveLength(1);
  });

  it('updates room state when handleTransferred is called', () => {
    let currentRoom: Room | null = mockRoom;
    const setRoom = vi.fn((updater) => {
      currentRoom = typeof updater === 'function' ? updater(currentRoom) : updater;
    });
    const setProblems = vi.fn();

    const { result } = renderHook(() =>
      useRoomProblemsModals('room-1', 'owner-1', setRoom, setProblems),
    );

    act(() => {
      result.current.handleTransferred('tutor-2');
    });

    expect(setRoom).toHaveBeenCalled();
    expect(currentRoom).toEqual({ ...mockRoom, professorResponsavelId: 'tutor-2' });
  });
});
