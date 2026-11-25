import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserResponse } from '@/types/auth';
import type { Room } from '@/types/room';
import { RoomProblemsModals } from './RoomProblemsModals';
import type { useRoomProblemsModals } from './hooks/useRoomProblemsModals';

vi.mock('./ProblemFormModal', () => ({
  ProblemFormModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="problem-form-modal">ProblemFormModal</div> : null,
}));

vi.mock('../rooms/invite/RoomInviteSheet', () => ({
  RoomInviteSheet: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="room-invite-sheet">RoomInviteSheet</div> : null,
}));

vi.mock('../rooms/TransferRoomModal', () => ({
  TransferRoomModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="transfer-room-modal">TransferRoomModal</div> : null,
}));

const mockTeacherOwner: UserResponse = {
  id: 'owner-id',
  nome: 'Prof. Titular',
  email: 'titular@test.com',
  tipo: 'PROFESSOR',
  matricula: null,
  possuiFoto: false,
  ativo: true,
  criadoEm: '2026-01-01',
};

const mockTeacherCoTutor: UserResponse = {
  id: 'cotutor-id',
  nome: 'Profa. Cotutora',
  email: 'cotutor@test.com',
  tipo: 'PROFESSOR',
  matricula: null,
  possuiFoto: false,
  ativo: true,
  criadoEm: '2026-01-01',
};

const mockRoom: Room = {
  id: 'room-1',
  nome: 'MI - Programação - TP01',
  codigoDisciplina: 'EXA801',
  codigoSala: 'aB7kP2x9',
  semestre: '2026.2',
  ativo: true,
  criadoEm: '2026-01-01T00:00:00.000Z',
  professorResponsavelId: 'owner-id',
};

function createMockModals(overrides: Partial<ReturnType<typeof useRoomProblemsModals>> = {}) {
  return {
    isCreateOpen: false,
    openCreate: vi.fn(),
    closeCreate: vi.fn(),
    handleCreateSuccess: vi.fn(),
    isInviteOpen: false,
    openInviteStudents: vi.fn(),
    closeInvite: vi.fn(),
    inviteTab: 'alunos' as const,
    isTransferOpen: false,
    closeTransfer: vi.fn(),
    eligibleTutors: [],
    handleTransferClick: vi.fn(),
    handleTransferred: vi.fn(),
    startInviteCoTutor: vi.fn(),
    handleTutorAdded: vi.fn(),
    ...overrides,
  };
}

describe('RoomProblemsModals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ProblemFormModal when isCreateOpen is true', () => {
    const modals = createMockModals({ isCreateOpen: true });
    render(<RoomProblemsModals room={mockRoom} user={mockTeacherOwner} modals={modals} />);

    expect(screen.getByTestId('problem-form-modal')).toBeInTheDocument();
    expect(screen.queryByTestId('room-invite-sheet')).not.toBeInTheDocument();
    expect(screen.queryByTestId('transfer-room-modal')).not.toBeInTheDocument();
  });

  it('renders RoomInviteSheet when isInviteOpen is true and user is a professor', () => {
    const modals = createMockModals({ isInviteOpen: true });
    render(<RoomProblemsModals room={mockRoom} user={mockTeacherOwner} modals={modals} />);

    expect(screen.getByTestId('room-invite-sheet')).toBeInTheDocument();
  });

  it('renders TransferRoomModal when isTransferOpen is true and user is the owner', () => {
    const modals = createMockModals({ isTransferOpen: true });
    render(<RoomProblemsModals room={mockRoom} user={mockTeacherOwner} modals={modals} />);

    expect(screen.getByTestId('transfer-room-modal')).toBeInTheDocument();
  });

  it('does not render TransferRoomModal when user is a co-tutor', () => {
    const modals = createMockModals({ isTransferOpen: true });
    render(<RoomProblemsModals room={mockRoom} user={mockTeacherCoTutor} modals={modals} />);

    expect(screen.queryByTestId('transfer-room-modal')).not.toBeInTheDocument();
  });
});
