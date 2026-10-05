import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProblemTopActions } from './ProblemTopActions';

describe('ProblemTopActions', () => {
  it('renders Relatório Final button when user is a professor', () => {
    render(<ProblemTopActions isProfessor={true} />);

    expect(screen.getByRole('button', { name: /relatório final/i })).toBeInTheDocument();
    expect(screen.getByText('Nota final do problema')).toBeInTheDocument();
  });

  it('renders nothing when user is not a professor', () => {
    const { container } = render(<ProblemTopActions isProfessor={false} />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole('button', { name: /relatório final/i })).not.toBeInTheDocument();
  });
});
