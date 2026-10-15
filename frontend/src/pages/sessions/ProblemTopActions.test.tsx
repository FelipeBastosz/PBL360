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

  it('renders disabled Formulas button with Em breve description', () => {
    renderActions(true);
    const button = screen.getByRole('button', { name: /fórmulas/i });
    expect(button).toBeDisabled();
    expect(screen.getByText('Em breve')).toBeInTheDocument();
  });

  it('renders nothing when user is not a professor', () => {
    const { container } = renderActions(false);
    expect(container.firstChild).toBeNull();
  });
});
