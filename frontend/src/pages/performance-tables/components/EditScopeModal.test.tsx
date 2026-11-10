import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EditScopeModal } from './EditScopeModal';
import type { TableSessionUsage } from '@/types/session';

const mockSessions: TableSessionUsage[] = [
  { sessaoId: 's1', rotulo: 'P1S1', jaAconteceu: true },
  { sessaoId: 's2', rotulo: 'P1S2', jaAconteceu: false },
  { sessaoId: 's3', rotulo: 'P1S3', jaAconteceu: false },
];

describe('EditScopeModal', () => {
  it('renders modal with options and lists sessions', () => {
    render(
      <EditScopeModal
        isOpen={true}
        isLoading={false}
        sessions={mockSessions}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Onde aplicar as alterações?' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Aplicar só nesta sessão/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Em todas as 3 sessões que usam esta tabela/i),
    ).toBeInTheDocument();
    expect(screen.getByText('P1S1')).toBeInTheDocument();
    expect(screen.getByText('P1S2')).toBeInTheDocument();
    expect(screen.getByText('P1S3')).toBeInTheDocument();
    expect(screen.getByText('já aconteceu')).toBeInTheDocument();
  });

  it('confirms with default scope SESSAO', async () => {
    const onConfirm = vi.fn();
    render(
      <EditScopeModal
        isOpen={true}
        isLoading={false}
        sessions={mockSessions}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Confirmar e salvar' }));
    expect(onConfirm).toHaveBeenCalledWith('SESSAO');
  });

  it('allows selecting TODAS and confirms with TODAS', async () => {
    const onConfirm = vi.fn();
    render(
      <EditScopeModal
        isOpen={true}
        isLoading={false}
        sessions={mockSessions}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByLabelText(/Em todas as 3 sessões/i));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar e salvar' }));
    expect(onConfirm).toHaveBeenCalledWith('TODAS');
  });

  it('calls onCancel when clicking cancel or close button', async () => {
    const onCancel = vi.fn();
    render(
      <EditScopeModal
        isOpen={true}
        isLoading={false}
        sessions={mockSessions}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledOnce();

    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onCancel).toHaveBeenCalledTimes(2);
  });
});
