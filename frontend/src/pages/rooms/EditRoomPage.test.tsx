import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type * as Router from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { roomService } from '@/services/room.service';
import { ROUTES } from '@/routes/paths';
import type { Room } from '@/types/room';
import EditRoomPage from './EditRoomPage';

vi.mock('@/services/room.service', () => ({
  roomService: {
    getById: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { nome: 'Professor Silva' },
  }),
}));

const mockNotify = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    notify: mockNotify,
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof Router>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/utils/urlBuilder', () => ({
  buildRoomInviteUrl: (code: string) => `https://pbl360.app/salas/${code}`,
}));

const mockRoom: Room = {
  id: 'room-123',
  nome: 'MI - Engenharia de Software - TP01',
  codigoDisciplina: 'EXA863',
  codigoSala: 'aB7kP2x9',
  semestre: '2026.1',
  ativo: true,
  criadoEm: '2026-01-01T00:00:00.000Z',
  professorResponsavelId: '1',
};

describe('EditRoomPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(roomService.getById).mockResolvedValue(mockRoom);

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    });
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={['/turmas/room-123/editar']}>
        <Routes>
          <Route path="/turmas/:id/editar" element={<EditRoomPage />} />
        </Routes>
      </MemoryRouter>,
    );
  };

  it('renders prefilled room data and keeps discipline fields disabled', async () => {
    renderComponent();

    expect(await screen.findByDisplayValue('EXA863')).toBeInTheDocument();
    expect(screen.getByDisplayValue('MI - Engenharia de Software')).toBeInTheDocument();
    expect(screen.getByDisplayValue('TP01')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2026.1')).toBeInTheDocument();

    expect(screen.getByLabelText('Código da Disciplina')).toBeDisabled();
    expect(screen.getByLabelText('Nome da Disciplina')).toBeDisabled();

    expect(screen.getByLabelText('Turma')).toBeEnabled();
    expect(screen.getByLabelText('Semestre')).toBeEnabled();
  });

  it('submits updated room data, notifies with toast and navigates back', async () => {
    const user = userEvent.setup();
    vi.mocked(roomService.update).mockResolvedValue({ ...mockRoom, semestre: '2026.2' });

    renderComponent();

    const turmaInput = await screen.findByLabelText('Turma');
    const semestreInput = screen.getByLabelText('Semestre');

    await user.clear(turmaInput);
    await user.type(turmaInput, 'TP02');

    await user.clear(semestreInput);
    await user.type(semestreInput, '2026.2');

    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => {
      expect(roomService.update).toHaveBeenCalledWith('room-123', {
        nome: 'MI - Engenharia de Software - TP02',
        semestre: '2026.2',
      });
      expect(mockNotify).toHaveBeenCalledWith({
        tone: 'success',
        message: 'Turma atualizada com sucesso!',
      });
      expect(mockNavigate).toHaveBeenCalledWith(ROUTES.manageRooms);
    });
  });

  it('copies access code to clipboard when copy button is clicked', async () => {
    const user = userEvent.setup();
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    renderComponent();

    const copyCodeBtn = await screen.findByRole('button', { name: 'Copiar Código de Acesso' });
    await user.click(copyCodeBtn);

    expect(writeTextSpy).toHaveBeenCalledWith('aB7kP2x9');
  });
});
