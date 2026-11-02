import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sessionService } from '@/services/session.service';
import type { Session } from '@/types/session';
import { SessionFormModal } from './SessionFormModal';

vi.mock('@/services/session.service', () => ({
  sessionService: {
    create: vi.fn(),
    update: vi.fn(),
  },
}));

describe('SessionFormModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(
      <SessionFormModal
        isOpen={false}
        roomId="room-1"
        problemId="prob-1"
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows validation errors when submitting with empty required fields', async () => {
    const user = userEvent.setup();

    render(
      <SessionFormModal
        isOpen={true}
        roomId="room-1"
        problemId="prob-1"
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Criar sessão' }));

    expect(screen.getByText('O título da sessão é obrigatório.')).toBeInTheDocument();
    expect(screen.getByText('A data da sessão é obrigatória.')).toBeInTheDocument();
    expect(sessionService.create).not.toHaveBeenCalled();
  });

  it('creates session and calls onSuccess with converted DD-MM-AAAA date', async () => {
    const user = userEvent.setup();
    const createdSession: Session = {
      id: 'sess-10',
      titulo: 'Sessão 2',
      descricao: 'Fechamento',
      data: '20-10-2026',
      ordem: 2,
      status: 'agendada',
    };
    vi.mocked(sessionService.create).mockResolvedValue(createdSession);

    render(
      <SessionFormModal
        isOpen={true}
        roomId="room-1"
        problemId="prob-1"
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    await user.type(screen.getByLabelText('Título da Sessão'), 'Sessão 2');
    await user.type(screen.getByLabelText('Descrição da Sessão'), 'Fechamento');
    await user.type(screen.getByLabelText('Data da Sessão'), '2026-10-20');

    await user.click(screen.getByRole('button', { name: 'Criar sessão' }));

    await waitFor(() => {
      // Valida que o payload converteu a data para DD-MM-AAAA no envio:
      expect(sessionService.create).toHaveBeenCalledWith('room-1', 'prob-1', {
        titulo: 'Sessão 2',
        descricao: 'Fechamento',
        data: '20-10-2026',
      });
      expect(mockOnSuccess).toHaveBeenCalledWith(createdSession);
    });
  });

  it('pre-fills input date converting from API DD-MM-AAAA format when editing', () => {
    const existingSession: Session = {
      id: 'sess-10',
      titulo: 'Sessão Existente',
      descricao: 'Descrição existente',
      data: '25-12-2026',
      ordem: 1,
      status: 'agendada',
    };

    render(
      <SessionFormModal
        isOpen={true}
        roomId="room-1"
        problemId="prob-1"
        initialData={existingSession}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    // O input type="date" recebe convertido para AAAA-MM-DD:
    expect(screen.getByLabelText('Data da Sessão')).toHaveValue('2026-12-25');
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();

    render(
      <SessionFormModal
        isOpen={true}
        roomId="room-1"
        problemId="prob-1"
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    await user.keyboard('{Escape}');
    expect(mockOnClose).toHaveBeenCalledOnce();
  });
});
