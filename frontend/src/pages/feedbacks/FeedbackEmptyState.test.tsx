import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FeedbackEmptyState } from './FeedbackEmptyState';

describe('FeedbackEmptyState', () => {
  it('renders default empty message for session feedback', () => {
    render(<FeedbackEmptyState />);

    expect(
      screen.getByText('Seu tutor ainda não enviou feedback para esta sessão'),
    ).toBeInTheDocument();
  });

  it('renders custom empty message when provided', () => {
    render(<FeedbackEmptyState message="Nenhum feedback registrado." />);

    expect(screen.getByText('Nenhum feedback registrado.')).toBeInTheDocument();
  });
});
