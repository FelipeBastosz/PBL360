import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppHeader } from './AppHeader';

describe('AppHeader', () => {
  it('shows the brand mark by default', () => {
    render(<AppHeader userName="Paulo Ferreira" />, { wrapper: MemoryRouter });

    expect(screen.getByRole('img', { name: 'PBL360' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Minha conta' })).toBeInTheDocument();
  });

  it('shows a back link and a title in the "back" variant', () => {
    render(
      <AppHeader variant="back" title="Turma criada" backTo="/turmas" userName="Paulo Ferreira" />,
      { wrapper: MemoryRouter },
    );

    expect(screen.getByRole('heading', { name: 'Turma criada' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar' })).toHaveAttribute('href', '/turmas');
  });
});
