import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SessionsEmptyState } from './SessionsEmptyState';

describe('SessionsEmptyState', () => {
  it('renders teacher-specific message and prompt to schedule first session', () => {
    render(<SessionsEmptyState isProfessor={true} />);

    expect(screen.getByText('Nenhuma sessão cadastrada neste problema.')).toBeInTheDocument();
    expect(screen.getByText(/para agendar a primeira sessão/i)).toBeInTheDocument();
  });

  it('renders student-specific message and waiting advice', () => {
    render(<SessionsEmptyState isProfessor={false} />);

    expect(
      screen.getByText('Nenhuma sessão disponível neste problema no momento.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/aguarde o professor agendar as sessões/i)).toBeInTheDocument();
    expect(screen.queryByText(/toque no/i)).not.toBeInTheDocument();
  });
});
