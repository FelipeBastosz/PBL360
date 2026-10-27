import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useAuth } from '@/hooks/useAuth';
import { sessionService } from '@/services/session.service';
import { performanceTableService } from '@/services/performance-table.service';
import SessionFormulasPage from './SessionFormulasPage';

vi.mock('@/hooks/useAuth');
vi.mock('@/services/session.service');
vi.mock('@/services/performance-table.service');
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: vi.fn() }),
}));

describe('SessionFormulasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'prof-1', nome: 'Professor' },
    } as unknown as ReturnType<typeof useAuth>);
    vi.mocked(performanceTableService.listByRoom).mockResolvedValue([]);
    vi.mocked(sessionService.getEvaluationConfig).mockResolvedValue({
      tabela: { id: 't-1', nome: 'Tabela Padrão', padrao: true, criterios: [] },
      formula: {
        padrao: true,
        versao: null,
        componentes: [
          { tipo: 'CRITERIOS', peso: 70 },
          { tipo: 'PAPEL', peso: 30 },
        ],
      },
      bloqueada: false,
    });
  });

  it('renders performance tables tab by default and switches to final score tab', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/turmas/r1/problemas/p1/sessoes/s1/formulas']}>
        <Routes>
          <Route
            path="/turmas/:roomId/problemas/:problemId/sessoes/:sessionId/formulas"
            element={<SessionFormulasPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Fórmulas de Desempenho' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fórmula da Nota Final' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Fórmula da Nota Final' }));

    expect(await screen.findByText('Desempenho na Sessão')).toBeInTheDocument();
    expect(screen.getByText('Desempenho no Cargo')).toBeInTheDocument();
    expect(screen.getByDisplayValue('7,0')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3,0')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar fórmula' })).toBeInTheDocument();
  });
});
