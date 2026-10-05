import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { performanceTableService } from '@/services/performance-table.service';
import type { PerformanceTable } from '@/types/performanceTable';
import { EditPerformanceTablePage } from './EditPerformanceTablePage';

const mockNotify = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: mockNotify }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { nome: 'Professor Fulano', tipo: 'TUTOR' } }),
}));

vi.mock('@/services/performance-table.service');

const mockTable: PerformanceTable = {
  id: 'table-1',
  professorId: 'tutor-1',
  nome: 'Sessão de apresentação',
  descricao: 'Formula para sessões com apresentação de resultados e/ou metas',
  quantidadeProblemas: 0,
  criterios: [
    { id: 'c1', nome: 'Comportamento', descricao: 'Comportamento dos colegas', peso: 5, ordem: 1 },
    { id: 'c2', nome: 'Domínio', descricao: 'Domínio da solução', peso: 5, ordem: 2 },
  ],
  criadoEm: '2026-03-01T10:00:00Z',
  atualizadoEm: '2026-03-01T10:00:00Z',
};

describe('EditPerformanceTablePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(performanceTableService.getById).mockResolvedValue(mockTable);
  });

  function renderPage(id = 'table-1') {
    return render(
      <MemoryRouter initialEntries={[`/formulas/${id}/editar`]}>
        <Routes>
          <Route path="/formulas/:id/editar" element={<EditPerformanceTablePage />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it('renders table details and criteria for editing', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'Sessão de apresentação' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Comportamento')).toBeInTheDocument();
    expect(screen.getByText('Domínio')).toBeInTheDocument();
  });

  it('prompts user with warning modal before saving formula alterations', async () => {
    vi.mocked(performanceTableService.update).mockResolvedValue(mockTable);
    renderPage();

    await screen.findByRole('heading', { name: 'Sessão de apresentação' });
    await userEvent.click(screen.getByRole('button', { name: 'Concluir edição' }));

    expect(screen.getByText('Salvar alterações na fórmula?')).toBeInTheDocument();
    expect(screen.getByText(/sessões que já foram avaliadas com esta fórmula/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Confirmar e salvar' }));

    expect(performanceTableService.update).toHaveBeenCalledWith(
      'table-1',
      expect.objectContaining({ nome: 'Sessão de apresentação' }),
    );
    expect(mockNotify).toHaveBeenCalledWith({
      tone: 'success',
      message: 'Fórmula atualizada com sucesso.',
    });
  });

  it('opens modal to delete a criterion and removes it when confirmed', async () => {
    renderPage();

    await screen.findByRole('heading', { name: 'Sessão de apresentação' });
    await userEvent.click(screen.getByRole('button', { name: 'Excluir critério Comportamento' }));

    expect(screen.getByText('Excluir critério?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Sim, excluir critério' }));

    expect(screen.queryByText('Comportamento')).not.toBeInTheDocument();
    expect(screen.getByText('Domínio')).toBeInTheDocument();
  });

  it('opens modal to delete the entire formula and deletes via service', async () => {
    vi.mocked(performanceTableService.remove).mockResolvedValue();
    renderPage();

    await screen.findByRole('heading', { name: 'Sessão de apresentação' });
    await userEvent.click(screen.getByRole('button', { name: 'Excluir essa fórmula' }));

    expect(screen.getByText('Excluir fórmula?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Sim, excluir fórmula' }));

    expect(performanceTableService.remove).toHaveBeenCalledWith('table-1');
    expect(mockNotify).toHaveBeenCalledWith({
      tone: 'success',
      message: 'Fórmula excluída com sucesso.',
    });
  });
});
