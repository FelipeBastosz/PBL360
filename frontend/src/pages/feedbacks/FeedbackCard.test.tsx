import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FeedbackCard } from './FeedbackCard';

describe('FeedbackCard', () => {
  const baseAuthor = { id: 'prof-1', nome: 'Prof. Ana Martins' };

  it('renders author, date, and feedback text', () => {
    render(
      <FeedbackCard
        autor={baseAuthor}
        texto="Excelente argumentação e participação na síntese."
        criadoEm="2026-04-10T14:30:00Z"
      />,
    );

    expect(screen.getByText('Prof. Ana Martins')).toBeInTheDocument();
    expect(
      screen.getByText('Excelente argumentação e participação na síntese.'),
    ).toBeInTheDocument();
  });

  it('renders "Novo" badge when novo is true', () => {
    render(
      <FeedbackCard
        autor={baseAuthor}
        texto="Feedback novo"
        criadoEm="2026-04-10T14:30:00Z"
        novo={true}
      />,
    );

    expect(screen.getByTestId('badge-novo')).toBeInTheDocument();
    expect(screen.getByText('Novo')).toBeInTheDocument();
  });

  it('does not render "Novo" badge when novo is false or undefined', () => {
    render(
      <FeedbackCard
        autor={baseAuthor}
        texto="Feedback lido"
        criadoEm="2026-04-10T14:30:00Z"
        novo={false}
      />,
    );

    expect(screen.queryByTestId('badge-novo')).not.toBeInTheDocument();
  });

  it('renders "editado em" when editadoEm is provided', () => {
    render(
      <FeedbackCard
        autor={baseAuthor}
        texto="Feedback editado"
        criadoEm="2026-04-10T14:30:00Z"
        editadoEm="2026-04-11T09:00:00Z"
      />,
    );

    expect(screen.getByText(/editado em/i)).toBeInTheDocument();
  });

  it('renders score when provided', () => {
    render(
      <FeedbackCard
        autor={baseAuthor}
        texto="Feedback individual com nota"
        criadoEm="2026-04-10T14:30:00Z"
        nota={9.5}
      />,
    );

    expect(screen.getByTestId('feedback-nota')).toHaveTextContent('Nota 9.5');
  });
});
