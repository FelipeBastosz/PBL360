import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ProblemDeletionImpact } from '@/types/problem';
import { DeleteProblemModal } from './DeleteProblemModal';

const mockImpact: ProblemDeletionImpact = {
  sessoes: 3,
  avaliacoes: 12,
  notas: 24,
  feedbacks: 5,
};

describe('DeleteProblemModal', () => {
  it('does not render when isOpen is false', () => {
    render(
      <DeleteProblemModal
        problemTitle="Problema 1"
        impact={mockImpact}
        isOpen={false}
        isLoading={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders problem title and detailed impact counts when open', () => {
    render(
      <DeleteProblemModal
        problemTitle="Problema 1 - Diagnóstico"
        impact={mockImpact}
        isOpen={true}
        isLoading={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Excluir problema?' })).toBeInTheDocument();
    expect(screen.getByText('Problema 1 - Diagnóstico')).toBeInTheDocument();

    // Valida se o impacto detalhado está no texto
    expect(screen.getByText(/3 sessões/i)).toBeInTheDocument();
    expect(screen.getByText(/12 avaliações/i)).toBeInTheDocument();
    expect(screen.getByText(/24 notas/i)).toBeInTheDocument();
  });

  it('renders loading feedback when impact data is null', () => {
    render(
      <DeleteProblemModal
        problemTitle="Problema 1"
        impact={null}
        isOpen={true}
        isLoading={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText('Carregando impacto da exclusão...')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <DeleteProblemModal
        problemTitle="Problema 1"
        impact={mockImpact}
        isOpen={true}
        isLoading={false}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Sim, excluir problema' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel on safe cancel button or close button click', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <DeleteProblemModal
        problemTitle="Problema 1"
        impact={mockImpact}
        isOpen={true}
        isLoading={false}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Fechar confirmação' }));
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it('calls onCancel when Escape key is pressed', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <DeleteProblemModal
        problemTitle="Problema 1"
        impact={mockImpact}
        isOpen={true}
        isLoading={false}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );

    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
