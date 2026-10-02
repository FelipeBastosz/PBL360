import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { PerformanceTablesPage } from './PerformanceTablesPage';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { nome: 'Professor Fulano', tipo: 'TUTOR' } }),
}));

describe('PerformanceTablesPage', () => {
  function renderPage() {
    return render(
      <MemoryRouter>
        <PerformanceTablesPage />
      </MemoryRouter>,
    );
  }

  it('renders the header correctly with back button', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Fórmulas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument();
  });

  it('renders the search input with correct placeholder', () => {
    renderPage();
    const searchInput = screen.getByPlaceholderText('Pesquisar fórmula');
    expect(searchInput).toBeInTheDocument();
  });

  it('displays the empty state when there are no formulas', async () => {
    renderPage();

    expect(
      await screen.findByText('Você ainda não possui fórmulas cadastradas.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Toque no/)).toBeInTheDocument();
  });

  it('toggles the fab menu correctly', async () => {
    renderPage();

    const fabButton = screen.getByRole('button', { name: 'Ações de fórmula' });
    expect(screen.queryByText('Criar nova fórmula')).not.toBeInTheDocument();

    await userEvent.click(fabButton);
    expect(screen.getByText('Criar nova fórmula')).toBeInTheDocument();
    expect(screen.getByText('Editar uma fórmula')).toBeInTheDocument();
    expect(screen.getByText('Ordenar fórmulas')).toBeInTheDocument();

    await userEvent.click(fabButton);
    expect(screen.queryByText('Criar nova fórmula')).not.toBeInTheDocument();
  });
});
