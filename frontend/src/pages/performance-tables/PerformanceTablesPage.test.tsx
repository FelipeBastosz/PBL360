import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { performanceTableService } from '@/services/performance-table.service';
import { useAuth } from '@/hooks/useAuth';
import { PerformanceTablesPage } from './PerformanceTablesPage';
import type { PerformanceTableSummary } from '@/types/performanceTable';

vi.mock('@/services/performance-table.service');
vi.mock('@/hooks/useAuth');
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: vi.fn() }),
}));

const mockUser = { id: 'user-tutor-1', nome: 'Professor Titular', name: 'Professor Titular' };

const mockRoomTables: PerformanceTableSummary[] = [
  {
    id: 't-padrao-1',
    nome: 'Tabela Oficial Padrão',
    descricao: 'Tabela do sistema',
    quantidadeCriterios: 3,
    origem: 'PADRAO',
    autor: { id: null, nome: 'Sistema' },
    emUso: 4,
  },
  {
    id: 't-turma-1',
    nome: 'Barema Compartilhado Turma A',
    descricao: 'Criada para a turma',
    quantidadeCriterios: 4,
    origem: 'TURMA',
    autor: { id: 'other-tutor', nome: 'Outro Professor' },
    emUso: 2,
  },
  {
    id: 't-pessoal-1',
    nome: 'Meu Barema Exclusivo',
    descricao: 'Barema pessoal',
    quantidadeCriterios: 2,
    origem: 'PESSOAL',
    autor: { id: 'user-tutor-1', nome: 'Professor Titular' },
    emUso: 1,
  },
];

describe('PerformanceTablesPage (Room Context)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      token: 'fake-jwt',
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      verifyAccount: vi.fn(),
      resendVerification: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
      updateProfile: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);
  });

  it('renders tables divided into 3 groups when inside a room context', async () => {
    vi.mocked(performanceTableService.listByRoom).mockResolvedValue(mockRoomTables);

    render(
      <MemoryRouter initialEntries={[{ state: { roomId: 'room-123' } }]}>
        <PerformanceTablesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Padrão do sistema/i)).toBeInTheDocument();
    expect(screen.getByText(/Da turma/i)).toBeInTheDocument();
    expect(screen.getByText(/Minhas/i)).toBeInTheDocument();

    expect(screen.getByText('Tabela Oficial Padrão')).toBeInTheDocument();
    expect(screen.getByText('Barema Compartilhado Turma A')).toBeInTheDocument();
    expect(screen.getByText('Meu Barema Exclusivo')).toBeInTheDocument();

    expect(screen.getByText('Outro Professor')).toBeInTheDocument();
    expect(screen.getByText(/4 sessões em uso/i)).toBeInTheDocument();
  });

  it('allows delete action ONLY for tables created by the logged user', async () => {
    vi.mocked(performanceTableService.listByRoom).mockResolvedValue(mockRoomTables);

    render(
      <MemoryRouter initialEntries={[{ state: { roomId: 'room-123' } }]}>
        <PerformanceTablesPage />
      </MemoryRouter>,
    );

    await screen.findByText('Meu Barema Exclusivo');

    expect(
      screen.getByRole('button', { name: 'Excluir fórmula Meu Barema Exclusivo' }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole('button', { name: 'Excluir fórmula Barema Compartilhado Turma A' }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole('button', { name: 'Excluir fórmula Tabela Oficial Padrão' }),
    ).not.toBeInTheDocument();
  });

  it('opens confirmation modal and removes table when author confirms deletion', async () => {
    vi.mocked(performanceTableService.listByRoom).mockResolvedValue(mockRoomTables);
    vi.mocked(performanceTableService.remove).mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={[{ state: { roomId: 'room-123' } }]}>
        <PerformanceTablesPage />
      </MemoryRouter>,
    );

    const deleteBtn = await screen.findByRole('button', {
      name: 'Excluir fórmula Meu Barema Exclusivo',
    });
    await userEvent.click(deleteBtn);

    expect(screen.getByText('Excluir fórmula?')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'Sim, excluir fórmula' });
    await userEvent.click(confirmBtn);

    expect(performanceTableService.remove).toHaveBeenCalledWith('t-pessoal-1');
  });
});

describe('PerformanceTablesPage (Global / User Menu Context)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      token: 'fake-jwt',
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      verifyAccount: vi.fn(),
      resendVerification: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
      updateProfile: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);
  });

  it('renders user and default formulas when navigating to /formulas without room/session', async () => {
    vi.mocked(performanceTableService.list).mockResolvedValue(mockRoomTables);

    render(
      <MemoryRouter initialEntries={['/formulas']}>
        <PerformanceTablesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Padrão do sistema/i)).toBeInTheDocument();
    expect(screen.getByText(/Minhas/i)).toBeInTheDocument();
    expect(screen.queryByText(/Da turma/i)).not.toBeInTheDocument();

    expect(screen.getByText('Tabela Oficial Padrão')).toBeInTheDocument();
    expect(screen.getByText('Meu Barema Exclusivo')).toBeInTheDocument();
    expect(screen.queryByText(/Fórmula em uso nesta sessão/i)).not.toBeInTheDocument();
  });

  it('clears stale sessionStorage apply target when accessing /formulas', async () => {
    sessionStorage.setItem(
      'pbl360_apply_target',
      JSON.stringify({ sessionId: 'stale-session-id', roomId: 'stale-room-id' }),
    );
    vi.mocked(performanceTableService.list).mockResolvedValue(mockRoomTables);

    render(
      <MemoryRouter initialEntries={['/formulas']}>
        <PerformanceTablesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Meu Barema Exclusivo')).toBeInTheDocument();
    expect(sessionStorage.getItem('pbl360_apply_target')).toBeNull();
    expect(screen.queryByText(/Fórmula em uso nesta sessão/i)).not.toBeInTheDocument();
    expect(performanceTableService.list).toHaveBeenCalled();
    expect(performanceTableService.listByRoom).not.toHaveBeenCalled();
  });
});
