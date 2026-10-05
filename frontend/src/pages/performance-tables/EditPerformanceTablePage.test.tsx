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

  it('opens modal to edit title and description', async () => {
    renderPage();

    await screen.findByRole('heading', { name: 'Sessão de apresentação' });
    await userEvent.click(screen.getByRole('button', { name: 'Editar descrição e título' }));

    const titleInput = screen.getByLabelText('Título da Fórmula');
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Novo Nome');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar Edição' }));

    expect(screen.getByRole('heading', { name: 'Novo Nome' })).toBeInTheDocument();
  });

  it('opens modal to edit a specific criterion and saves changes', async () => {
    vi.mocked(performanceTableService.update).mockResolvedValue(mockTable);
    renderPage();

    await screen.findByRole('heading', { name: 'Sessão de apresentação' });
    await userEvent.click(screen.getByRole('button', { name: 'Editar critério Comportamento' }));

    const nameInput = screen.getByLabelText('Nome do Critério');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Participação Geral');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar Edição' }));

    expect(screen.getByText('Participação Geral')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Concluir edição' }));

    expect(performanceTableService.update).toHaveBeenCalledWith(
      'table-1',
      expect.objectContaining({
        criterios: expect.arrayContaining([
          expect.objectContaining({ id: 'c1', nome: 'Participação Geral' }),
        ]),
      }),
    );
    expect(mockNotify).toHaveBeenCalledWith({
      tone: 'success',
      message: 'Fórmula atualizada com sucesso.',
    });
  });
});
