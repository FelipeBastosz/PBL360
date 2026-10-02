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

  it('blocks criterion addition if weight is less than 1 or greater than 10', async () => {
    renderPage({ nome: 'Barema Teste' });

    await userEvent.click(screen.getByText('+Adicionar critério'));
    await userEvent.type(screen.getByLabelText('Nome do critério'), 'Invalido');
    await userEvent.clear(screen.getByLabelText('Peso (1 a 10)'));
    await userEvent.type(screen.getByLabelText('Peso (1 a 10)'), '0');
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    expect(screen.getByText('O peso do critério deve estar entre 1 e 10.')).toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText('Peso (1 a 10)'));
    await userEvent.type(screen.getByLabelText('Peso (1 a 10)'), '11');
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    expect(screen.getByText('O peso do critério deve estar entre 1 e 10.')).toBeInTheDocument();
  });

  it('blocks adding a criterion that causes total weight to exceed 10', async () => {
    renderPage({ nome: 'Barema Teste' });

    await userEvent.click(screen.getByText('+Adicionar critério'));
    await userEvent.type(screen.getByLabelText('Nome do critério'), 'C1');
    await userEvent.clear(screen.getByLabelText('Peso (1 a 10)'));
    await userEvent.type(screen.getByLabelText('Peso (1 a 10)'), '7');
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    await userEvent.click(screen.getByText('+Adicionar critério'));
    await userEvent.type(screen.getByLabelText('Nome do critério'), 'C2');
    await userEvent.clear(screen.getByLabelText('Peso (1 a 10)'));
    await userEvent.type(screen.getByLabelText('Peso (1 a 10)'), '5');
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    expect(
      screen.getByText('A soma total dos pesos não pode ultrapassar 10. Restante: 3.'),
    ).toBeInTheDocument();
  });

  it('adds a criterion via modal and submits successfully', async () => {
    vi.mocked(performanceTableService.create).mockResolvedValue({} as never);
    renderPage({ nome: 'Barema Teste' });

    await userEvent.click(screen.getByText('+Adicionar critério'));
    await userEvent.type(screen.getByLabelText('Nome do critério'), 'Pontualidade');
    await userEvent.clear(screen.getByLabelText('Peso (1 a 10)'));
    await userEvent.type(screen.getByLabelText('Peso (1 a 10)'), '10');
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
