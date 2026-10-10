import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StudentPeerEvaluationPage from './StudentPeerEvaluationPage';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', nome: 'João Silva', possuiFoto: false, tipo: 'ALUNO' },
  }),
}));

describe('StudentPeerEvaluationPage', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.clearAllMocks();
  });

  const renderPage = () => {
    render(
      <MemoryRouter>
        <StudentPeerEvaluationPage />
      </MemoryRouter>,
    );
  };

  it('renders the header and peer evaluation cards', () => {
    renderPage();
    expect(screen.getByText('Avaliação dos Colegas')).toBeInTheDocument();
    expect(screen.getByText('Ana Souza')).toBeInTheDocument();
    expect(screen.getByText('Carlos Lima')).toBeInTheDocument();
  });

  it('increments score for a specific peer', async () => {
    renderPage();
    const anaSection = screen.getByRole('region', { name: 'Avaliação de Ana Souza' });
    const segmentoGroup = within(anaSection).getByRole('group', { name: 'Segmento' });
    const plusButton = within(segmentoGroup).getByRole('button', { name: '+' });

    await userEvent.click(plusButton);

    expect(within(segmentoGroup).getByText('9')).toBeInTheDocument();
  });

  it('decrements score for a specific peer', async () => {
    renderPage();
    const carlosSection = screen.getByRole('region', { name: 'Avaliação de Carlos Lima' });
    const segmentoGroup = within(carlosSection).getByRole('group', { name: 'Segmento' });
    const minusButton = within(segmentoGroup).getByRole('button', { name: '−' });

    await userEvent.click(minusButton);

    expect(within(segmentoGroup).getByText('7')).toBeInTheDocument();
  });

  it('navigates back when clicking the back button', async () => {
    renderPage();
    const backButton = screen.getByRole('button', { name: 'Voltar' });

    await userEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('navigates back when saving peer evaluations', async () => {
    renderPage();
    const saveButton = screen.getByRole('button', { name: 'Salvar Avaliações' });

    await userEvent.click(saveButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
