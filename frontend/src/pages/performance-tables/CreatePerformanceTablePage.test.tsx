import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { performanceTableService } from '@/services/performance-table.service';
import { CreatePerformanceTablePage } from './CreatePerformanceTablePage';

const mockNotify = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: mockNotify }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { nome: 'Professor Fulano', tipo: 'TUTOR' } }),
}));

vi.mock('@/services/performance-table.service');

describe('CreatePerformanceTablePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it('allows editing an added criterion in creation page', async () => {
    renderPage({ nome: 'Barema Teste' });

    await userEvent.click(screen.getByText('+Adicionar critério'));
    await userEvent.type(screen.getByLabelText('Nome do critério'), 'Pontualidade');
    await userEvent.clear(screen.getByLabelText('Peso (1 a 10)'));
    await userEvent.type(screen.getByLabelText('Peso (1 a 10)'), '5');
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    expect(screen.getByText('Pontualidade')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Editar critério Pontualidade' }));
    const nameInput = screen.getByLabelText('Nome do Critério');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Pontualidade e Foco');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar Edição' }));

    expect(screen.getByText('Pontualidade e Foco')).toBeInTheDocument();
  });

  it('allows deleting an added criterion in creation page', async () => {
    renderPage({ nome: 'Barema Teste' });

    await userEvent.click(screen.getByText('+Adicionar critério'));
    await userEvent.type(screen.getByLabelText('Nome do critério'), 'Pontualidade');
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    expect(screen.getByText('Pontualidade')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Excluir critério Pontualidade' }));
    expect(screen.getByText('Excluir critério?')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Sim, excluir critério' }));
    expect(screen.queryByText('Pontualidade')).not.toBeInTheDocument();
  });

  it('adds a criterion via modal and submits successfully when weights equal 10', async () => {
    vi.mocked(performanceTableService.create).mockResolvedValue({} as never);
    renderPage({ nome: 'Barema Teste' });

    await userEvent.click(screen.getByText('+Adicionar critério'));
    await userEvent.type(screen.getByLabelText('Nome do critério'), 'Pontualidade');
    await userEvent.clear(screen.getByLabelText('Peso (1 a 10)'));
    await userEvent.type(screen.getByLabelText('Peso (1 a 10)'), '10');
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    await userEvent.click(screen.getByRole('button', { name: 'Salvar Fórmula' }));

    expect(performanceTableService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: 'Barema Teste',
        criterios: [expect.objectContaining({ nome: 'Pontualidade', peso: 10 })],
      }),
    );
    expect(mockNotify).toHaveBeenCalledWith({
      tone: 'success',
      message: 'Fórmula criada com sucesso.',
    });
  });
});
