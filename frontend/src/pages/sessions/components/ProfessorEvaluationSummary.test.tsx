import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { SessionGeneralEvaluation } from '@/types/session';
import { ProfessorEvaluationSummary } from './ProfessorEvaluationSummary';

const mockEvaluation: SessionGeneralEvaluation = {
  id: 'eval-1',
  texto: 'Bom progresso geral na sessão.',
  autor: { id: 'prof-1', nome: 'Prof. Carlos' },
  criadoEm: '2026-04-12T10:00:00Z',
  editadoEm: null,
};

describe('ProfessorEvaluationSummary', () => {
  it('renders author, date, and text preview', () => {
    render(
      <ProfessorEvaluationSummary
        evaluation={mockEvaluation}
        isAuthor={true}
        canEdit={true}
        onOpenModal={vi.fn()}
      />,
    );

    expect(screen.getByText('Prof. Carlos')).toBeInTheDocument();
    expect(screen.getByText('(você)')).toBeInTheDocument();
    expect(screen.getByText('Bom progresso geral na sessão.')).toBeInTheDocument();
  });

  it('triggers onOpenModal when clicking edit button or text preview when canEdit is true', async () => {
    const user = userEvent.setup();
    const onOpenModal = vi.fn();
    render(
      <ProfessorEvaluationSummary
        evaluation={mockEvaluation}
        isAuthor={true}
        canEdit={true}
        onOpenModal={onOpenModal}
      />,
    );

    const editBtn = screen.getByRole('button', { name: 'Editar feedback geral' });
    await user.click(editBtn);
    expect(onOpenModal).toHaveBeenCalledTimes(1);

    const textPreview = screen.getByText('Bom progresso geral na sessão.');
    await user.click(textPreview);
    expect(onOpenModal).toHaveBeenCalledTimes(2);
  });

  it('does not render edit button when canEdit is false', () => {
    render(
      <ProfessorEvaluationSummary
        evaluation={mockEvaluation}
        isAuthor={false}
        canEdit={false}
        onOpenModal={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Editar feedback geral' })).not.toBeInTheDocument();
  });
});
