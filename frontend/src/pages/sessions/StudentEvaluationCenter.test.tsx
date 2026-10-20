import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { StudentEvaluationCenter } from './StudentEvaluationCenter';

describe('StudentEvaluationCenter', () => {
  it('renders all evaluation options as active links when params are present', () => {
    render(
      <MemoryRouter initialEntries={['/turmas/room-1/problemas/prob-1/sessoes/sess-1']}>
        <Routes>
          <Route
            path="/turmas/:roomId/problemas/:problemId/sessoes/:sessionId"
            element={<StudentEvaluationCenter />}
          />
        </Routes>
      </MemoryRouter>,
    );

    const autoavaliacaoLink = screen.getByRole('link', { name: /autoavaliação/i });
    expect(autoavaliacaoLink).toHaveAttribute('href', '/sessoes/sess-1/autoavaliacao');

    const paresLink = screen.getByRole('link', { name: /avaliar colegas/i });
    expect(paresLink).toHaveAttribute('href', '/sessoes/sess-1/avaliar-colegas');

    const feedbackLink = screen.getByRole('link', { name: /notas e feedbacks/i });
    expect(feedbackLink).toHaveAttribute(
      'href',
      '/turmas/room-1/problemas/prob-1/sessoes/sess-1/feedback',
    );

    expect(screen.queryByText('Em breve')).not.toBeInTheDocument();
  });

  it('renders locked state when session params are missing', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <StudentEvaluationCenter />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getAllByText('Em breve')).toHaveLength(3);
  });
});
