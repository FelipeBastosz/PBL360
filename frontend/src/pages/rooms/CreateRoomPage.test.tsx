import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type * as Router from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { roomService } from '@/services/room.service';
import { disciplineService } from '@/services/discipline.service';
import { ROUTES } from '@/routes/paths';
import type { Room } from '@/types/room';
import CreateRoomPage from './CreateRoomPage';

vi.mock('@/services/room.service', () => ({
  roomService: {
    create: vi.fn(),
  },
}));

vi.mock('@/services/discipline.service', () => ({
  disciplineService: {
    list: vi.fn(),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { nome: 'Professor Silva' },
  }),
}));

const mockNavigate = vi.fn();

// Correção do import type para agradar o ESLint:
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof Router>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('CreateRoomPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(disciplineService.list).mockResolvedValue([
      { id: 'd-1', codigo: 'EXA863', nome: 'MI Programação' },
      { id: 'd-2', codigo: 'TEC502', nome: 'MI Concorrência e Conectividade' },
    ]);
  });

  const selectDiscipline = async (user: ReturnType<typeof userEvent.setup>, value: string) => {
    await screen.findByRole('option', { name: 'EXA863 - MI Programação' });
    await user.selectOptions(screen.getByLabelText('Código'), value);
  };

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <CreateRoomPage />
      </MemoryRouter>,
    );
  };

  it('renders all main elements, headings, and inputs', () => {
    renderComponent();

    expect(screen.getByRole('heading', { name: 'Criar turma' })).toBeInTheDocument();
    expect(screen.getByLabelText('Código')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome da Disciplina')).toBeInTheDocument();
    expect(screen.getByLabelText('Turma')).toBeInTheDocument();
    expect(screen.getByLabelText('Semestre')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Criar turma' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('displays validation errors and prevents submission when fields are empty', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByRole('button', { name: 'Criar turma' }));

    expect(screen.getByText('O código é obrigatório.')).toBeInTheDocument();
    expect(screen.getByText('A disciplina é obrigatória.')).toBeInTheDocument();
    expect(screen.getByText('A turma é obrigatória.')).toBeInTheDocument();
    expect(screen.getByText('O semestre é obrigatório.')).toBeInTheDocument();

    expect(roomService.create).not.toHaveBeenCalled();
  });

  it('lists the disciplines registered in the database as options', async () => {
    renderComponent();

    expect(
      await screen.findByRole('option', { name: 'EXA863 - MI Programação' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'TEC502 - MI Concorrência e Conectividade' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Outra disciplina...' })).toBeInTheDocument();
  });

  it('shows an error when the disciplines cannot be loaded', async () => {
    vi.mocked(disciplineService.list).mockRejectedValue(new Error('Falha ao carregar'));

    renderComponent();

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Outra disciplina...' })).toBeInTheDocument();
  });

  it('auto-fills and disables discipline name when selecting an existing discipline', async () => {
    const user = userEvent.setup();
    renderComponent();

    await selectDiscipline(user, 'd-1');

    const disciplineInput = screen.getByLabelText('Nome da Disciplina');
    expect(disciplineInput).toHaveValue('MI Programação');
    expect(disciplineInput).toBeDisabled();
  });

  it('shows custom code field and enables discipline name when selecting "outra"', async () => {
    const user = userEvent.setup();
    renderComponent();

    await selectDiscipline(user, 'outra');

    expect(screen.getByLabelText('Código da Disciplina')).toBeInTheDocument();

    const disciplineInput = screen.getByLabelText('Nome da Disciplina');
    expect(disciplineInput).toBeEnabled();
    expect(disciplineInput).toHaveValue('');
  });

  it('submits the form successfully and navigates to the success page with state', async () => {
    const user = userEvent.setup();
    const mockRoom = { id: 'room-123', roomCode: 'ABC98765', nome: 'MI Programação - TP01' };

    // Correção: substituímos o 'as any' por 'as unknown as Room'
    vi.mocked(roomService.create).mockResolvedValue(mockRoom as unknown as Room);

    renderComponent();

    await selectDiscipline(user, 'd-1');
    await user.type(screen.getByLabelText('Turma'), 'TP01');
    await user.type(screen.getByLabelText('Semestre'), '2026.2');

    await user.click(screen.getByRole('button', { name: 'Criar turma' }));

    await waitFor(() => {
      expect(roomService.create).toHaveBeenCalledWith({
        nome: 'MI Programação - TP01',
        codigoDisciplina: 'EXA863',
        semestre: '2026.2',
      });
      expect(mockNavigate).toHaveBeenCalledWith(ROUTES.createRoomSuccess, {
        state: { room: mockRoom },
      });
    });
  });

  it('renders an error alert when the API returns an error', async () => {
    const user = userEvent.setup();
    vi.mocked(roomService.create).mockRejectedValue(new Error('Erro de conexão com o banco'));

    renderComponent();

    await selectDiscipline(user, 'd-1');
    await user.type(screen.getByLabelText('Turma'), 'TP01');
    await user.type(screen.getByLabelText('Semestre'), '2026.2');

    await user.click(screen.getByRole('button', { name: 'Criar turma' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
