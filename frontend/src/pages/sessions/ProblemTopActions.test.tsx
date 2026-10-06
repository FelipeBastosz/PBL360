import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ProblemTopActions } from './ProblemTopActions';

function renderActions(isProfessor: boolean) {
  return render(
    <MemoryRouter>
      <ProblemTopActions isProfessor={isProfessor} roomId="room-1" problemId="problem-1" />
    </MemoryRouter>,
  );
}

describe('ProblemTopActions', () => {
  it('renders Relatório Final button when user is a professor', () => {
    renderActions(true);

    expect(screen.getByRole('button', { name: /relatório final/i })).toBeInTheDocument();
    expect(screen.getByText('Nota final do problema')).toBeInTheDocument();
  });

  it('links professors to their formulas', () => {
    renderActions(true);

    expect(screen.getByRole('link', { name: /fórmulas/i })).toHaveAttribute('href', '/formulas');
  });

  it('renders nothing when user is not a professor', () => {
    const { container } = renderActions(false);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole('button', { name: /relatório final/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /fórmulas/i })).not.toBeInTheDocument();
  });
});
