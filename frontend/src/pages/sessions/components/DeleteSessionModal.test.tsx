import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { SessionDeletionImpact } from '@/types/session';
import { DeleteSessionModal } from './DeleteSessionModal';

const mockImpact: SessionDeletionImpact = {
  podeExcluir: true,
  papeis: 3,
  chamada: 12,
  avaliacoes: 8,
  observacoes: 0,
  feedbacks: 0,
};

describe('DeleteSessionModal', () => {
  it('does not render when isOpen is false', () => {
    render(
      <DeleteSessionModal
        sessionTitle="Sessão 1"
        impact={mockImpact}
        isOpen={false}
        isLoading={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders session title and impact counts when open', () => {
    render(
      <DeleteSessionModal
        sessionTitle="Sessão 1 - Abertura"
        impact={mockImpact}
        isOpen={true}
        isLoading={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Excluir sessão?' })).toBeInTheDocument();
    expect(screen.getByText('Sessão 1 - Abertura')).toBeInTheDocument();
    expect(screen.getByText(/3 papéis atribuídos/i)).toBeInTheDocument();
    expect(screen.getByText(/12 registros de chamada/i)).toBeInTheDocument();
    expect(screen.getByText(/8 avaliações/i)).toBeInTheDocument();
  });

  it('calls onConfirm when clicking confirm button', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <DeleteSessionModal
        sessionTitle="Sessão 1"
        impact={mockImpact}
        isOpen={true}
        isLoading={false}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Sim, excluir sessão' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when clicking safe cancel button or close button', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <DeleteSessionModal
        sessionTitle="Sessão 1"
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

  it('cancels on Escape unless the deletion is in progress', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const props = { sessionTitle: 'Sessão 1', impact: mockImpact, isOpen: true };

    const { rerender } = render(
      <DeleteSessionModal {...props} isLoading={true} onConfirm={vi.fn()} onCancel={onCancel} />,
    );
    await user.keyboard('{Escape}');
    expect(onCancel).not.toHaveBeenCalled();

    rerender(
      <DeleteSessionModal {...props} isLoading={false} onConfirm={vi.fn()} onCancel={onCancel} />,
    );
    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('renders contextual error alert and Entendi button when errorMessage is provided', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <DeleteSessionModal
        sessionTitle="Sessão 1"
        impact={mockImpact}
        isOpen={true}
        isLoading={false}
        errorMessage="Não é possível excluir: existem 3 feedbacks e 5 avaliações vinculados a esta sessão."
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Não é possível excluir a sessão' }),
    ).toBeInTheDocument();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(
      'Não é possível excluir: existem 3 feedbacks e 5 avaliações vinculados a esta sessão.',
    );
    expect(screen.queryByRole('button', { name: 'Sim, excluir sessão' })).not.toBeInTheDocument();

    const entendiBtn = screen.getByRole('button', { name: 'Entendi' });
    await user.click(entendiBtn);
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
