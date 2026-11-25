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
    await userEvent.clear(screen.getByLabelText('Peso (0 a 10)'));
    await userEvent.type(screen.getByLabelText('Peso (0 a 10)'), '5');
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
    await userEvent.clear(screen.getByLabelText('Peso (0 a 10)'));
    await userEvent.type(screen.getByLabelText('Peso (0 a 10)'), '10');
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    expect(screen.getByText('Soma dos pesos')).toBeInTheDocument();
    expect(screen.getByText('10 / 10')).toBeInTheDocument();

    const saveButton = screen.getByRole('button', { name: 'Salvar Fórmula' });
    expect(saveButton).toBeEnabled();
    await userEvent.click(saveButton);

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

  it('allows adding criteria exceeding 10, displays warning and keeps save button disabled until equal to 10', async () => {
    renderPage({ nome: 'Barema Teste' });

    const saveButton = screen.getByRole('button', { name: 'Salvar Fórmula' });
    expect(saveButton).toBeDisabled();
    expect(
      screen.getByText('A soma dos pesos deve ser exatamente 10 (atual: 0).'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByText('+Adicionar critério'));
    await userEvent.type(screen.getByLabelText('Nome do critério'), 'Critério 1');
    await userEvent.clear(screen.getByLabelText('Peso (0 a 10)'));
    await userEvent.type(screen.getByLabelText('Peso (0 a 10)'), '8');
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    expect(screen.getByText('Critério 1')).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
    expect(
      screen.getByText('A soma dos pesos deve ser exatamente 10 (atual: 8).'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByText('+Adicionar critério'));
    await userEvent.type(screen.getByLabelText('Nome do critério'), 'Critério 2');
    await userEvent.clear(screen.getByLabelText('Peso (0 a 10)'));
    await userEvent.type(screen.getByLabelText('Peso (0 a 10)'), '5');
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    expect(screen.getByText('Critério 2')).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
    expect(screen.getByText('13 / 10')).toBeInTheDocument();
    expect(screen.getByText('A soma dos pesos ultrapassou 10 (total: 13).')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Editar critério Critério 2' }));
    const weightInput = screen.getByLabelText('Peso');
    await userEvent.clear(weightInput);
    await userEvent.type(weightInput, '2');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar Edição' }));

    expect(screen.getByText('10 / 10')).toBeInTheDocument();
    expect(screen.getByText('Soma dos pesos')).toBeInTheDocument();
    expect(screen.queryByText(/A soma dos pesos (ultrapassou|deve)/i)).not.toBeInTheDocument();
    expect(saveButton).toBeEnabled();
  });

  it('validates that individual weight must be between 0 and 10 and enforces input bounds', async () => {
    renderPage({ nome: 'Barema Teste' });

    await userEvent.click(screen.getByText('+Adicionar critério'));
    const weightInput = screen.getByLabelText('Peso (0 a 10)');
    expect(weightInput).toHaveAttribute('aria-valuemin', '0');
    expect(weightInput).toHaveAttribute('aria-valuemax', '10');

    await userEvent.type(screen.getByLabelText('Nome do critério'), 'Critério Inválido');
    await userEvent.clear(weightInput);
    await userEvent.type(weightInput, '15');
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    expect(screen.getByText('O peso do critério deve estar entre 0 e 10.')).toBeInTheDocument();
  });

  it('increments and decrements weight by 1 using stepper buttons and bounds at 0 and 10', async () => {
    renderPage({ nome: 'Barema Stepper' });

    await userEvent.click(screen.getByText('+Adicionar critério'));
    const weightInput = screen.getByLabelText('Peso (0 a 10)');
    expect(weightInput).toHaveValue('1');

    const incrementButton = screen.getByRole('button', { name: 'Aumentar peso' });
    const decrementButton = screen.getByRole('button', { name: 'Diminuir peso' });

    await userEvent.click(incrementButton);
    expect(weightInput).toHaveValue('2');

    await userEvent.click(decrementButton);
    await userEvent.click(decrementButton);
    expect(weightInput).toHaveValue('0');
    expect(decrementButton).toBeDisabled();
  });

  it('formats decimal weights with comma and restricts to at most one decimal place', async () => {
    renderPage({ nome: 'Barema Decimal' });

    await userEvent.click(screen.getByText('+Adicionar critério'));
    const weightInput = screen.getByLabelText('Peso (0 a 10)');

    await userEvent.type(screen.getByLabelText('Nome do critério'), 'Critério Decimal');
    await userEvent.clear(weightInput);
    await userEvent.type(weightInput, '4.55');
    expect(weightInput).toHaveValue('4,5');

    await userEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
    expect(screen.getByText('Critério Decimal')).toBeInTheDocument();
    expect(screen.getByText('4,5')).toBeInTheDocument();
    expect(screen.getByText('4,5 / 10')).toBeInTheDocument();
    expect(
      screen.getByText('A soma dos pesos deve ser exatamente 10 (atual: 4,5).'),
    ).toBeInTheDocument();
  });
});
