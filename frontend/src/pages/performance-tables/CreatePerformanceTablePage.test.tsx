import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { performanceTableService } from '@/services/performance-table.service';
import { CreatePerformanceTablePage } from './CreatePerformanceTablePage';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { nome: 'Professor Fulano', tipo: 'TUTOR' } }),
}));

vi.mock('@/services/performance-table.service');

describe('CreatePerformanceTablePage', () => {
  function renderPage(state = {}) {
    return render(
      <MemoryRouter initialEntries={[{ pathname: '/formulas/nova', state }]}>
        <CreatePerformanceTablePage />
      </MemoryRouter>,
    );
  }

  it('renders form inputs correctly', () => {
    renderPage({ nome: 'Fórmula Inicial' });
    expect(screen.getByDisplayValue('Fórmula Inicial')).toBeInTheDocument();
    expect(screen.getByText('+Adicionar critério')).toBeInTheDocument();
  });

  it('shows error message if title is missing on save', async () => {
    renderPage({ nome: '' });

    await userEvent.click(screen.getByRole('button', { name: 'Salvar Fórmula' }));

    expect(screen.getByText('O título da fórmula é obrigatório.')).toBeInTheDocument();
  });

  it('shows error message if criteria list is empty on save', async () => {
    renderPage({ nome: 'Barema Teste' });

    await userEvent.click(screen.getByRole('button', { name: 'Salvar Fórmula' }));

    expect(
      screen.getByText('A tabela de desempenho deve possuir ao menos um critério.'),
    ).toBeInTheDocument();
  });

  it('adds a criterion via modal and submits successfully', async () => {
    vi.mocked(performanceTableService.create).mockResolvedValue({} as never);
    renderPage({ nome: 'Barema Teste' });

    await userEvent.click(screen.getByText('+Adicionar critério'));
    await userEvent.type(screen.getByLabelText('Nome do critério'), 'Pontualidade');
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    expect(screen.getByText('Pontualidade')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Salvar Fórmula' }));

    expect(performanceTableService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: 'Barema Teste',
        criterios: [expect.objectContaining({ nome: 'Pontualidade', peso: 10 })],
      }),
    );
  });
});
