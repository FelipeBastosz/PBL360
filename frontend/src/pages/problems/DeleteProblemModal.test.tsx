import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ProblemDeletionImpact } from '@/types/problem';
import { DeleteProblemModal } from './DeleteProblemModal';

const blockedImpact: ProblemDeletionImpact = {
  sessoes: 3,
  avaliacoes: 12,
  notas: 24,
  feedbacks: 5,
};

const zeroImpact: ProblemDeletionImpact = {
  sessoes: 0,
  avaliacoes: 0,
  notas: 0,
  feedbacks: 0,
};

describe('DeleteProblemModal', () => {
  it('does not render when isOpen is false', () => {
    render(
      <DeleteProblemModal
        problemTitle="Problema 1"
        impact={zeroImpact}
        isOpen={false}
        isLoading={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders blocked modal with Entendi button when problem has linked sessions', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <DeleteProblemModal
        problemTitle="Problema 1 - Diagnóstico"
        impact={blockedImpact}
        isOpen={true}
        isLoading={false}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Não é possível excluir o problema' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Problema 1 - Diagnóstico')).toBeInTheDocument();
    expect(screen.getByText(/3 sessões/i)).toBeInTheDocument();
    expect(screen.getByText(/12 avaliações/i)).toBeInTheDocument();
    expect(screen.getByText(/24 notas/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sim, excluir problema' })).not.toBeInTheDocument();

    const entendiBtn = screen.getByRole('button', { name: 'Entendi' });
    expect(entendiBtn).toBeInTheDocument();
    await user.click(entendiBtn);
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('renders confirmation modal and allows deletion when problem has no sessions', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <DeleteProblemModal
        problemTitle="Problema 2 - Sem Sessões"
        impact={zeroImpact}
        isOpen={true}
        isLoading={false}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Excluir problema?' })).toBeInTheDocument();
    expect(screen.getByText('Problema 2 - Sem Sessões')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Atenção: esta ação é irreversível e excluirá permanentemente este problema da turma.',
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sim, excluir problema' }));
    expect(onConfirm).toHaveBeenCalledOnce();
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

  it('calls onCancel on cancel link or close icon click', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <DeleteProblemModal
        problemTitle="Problema 1"
        impact={zeroImpact}
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
        impact={blockedImpact}
        isOpen={true}
        isLoading={false}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );

    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('renders contextual error alert and Entendi button when errorMessage is provided', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <DeleteProblemModal
        problemTitle="Problema 1"
        impact={zeroImpact}
        isOpen={true}
        isLoading={false}
        errorMessage="Não é possível excluir: existem 2 sessões e 1 feedback vinculados a este problema."
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Não é possível excluir o problema' }),
    ).toBeInTheDocument();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(
      'Não é possível excluir: existem 2 sessões e 1 feedback vinculados a este problema.',
    );
    expect(screen.queryByRole('button', { name: 'Sim, excluir problema' })).not.toBeInTheDocument();

    const entendiBtn = screen.getByRole('button', { name: 'Entendi' });
    await user.click(entendiBtn);
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
