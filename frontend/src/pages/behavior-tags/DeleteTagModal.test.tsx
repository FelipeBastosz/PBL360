import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DeleteTagModal } from './DeleteTagModal';

describe('DeleteTagModal', () => {
  it('does not render when isOpen is false', () => {
    render(
      <DeleteTagModal tagName="Atraso" isOpen={false} onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders title, tag name and warning text when open', () => {
    render(
      <DeleteTagModal tagName="Iniciativa" isOpen={true} onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Excluir marcação?' })).toBeInTheDocument();
    expect(screen.getByText('Iniciativa')).toBeInTheDocument();
    expect(
      screen.getByText(/se esta marcação tiver sido utilizada em algum aluno, ela irá sumir/i),
    ).toBeInTheDocument();
  });

  it('triggers onConfirm when confirming deletion', async () => {
    const onConfirm = vi.fn();
    render(
      <DeleteTagModal
        tagName="Iniciativa"
        isOpen={true}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Sim, excluir marcação' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('triggers onCancel when clicking cancel or close button', async () => {
    const onCancel = vi.fn();
    render(
      <DeleteTagModal tagName="Iniciativa" isOpen={true} onConfirm={vi.fn()} onCancel={onCancel} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledOnce();

    await userEvent.click(screen.getByRole('button', { name: 'Fechar confirmação' }));
    expect(onCancel).toHaveBeenCalledTimes(2);
  });
});
