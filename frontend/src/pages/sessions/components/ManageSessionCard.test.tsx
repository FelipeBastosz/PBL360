import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Session } from '@/types/session';
import { ManageSessionCard } from './ManageSessionCard';

const mockSession: Session = {
  id: 'sess-1',
  titulo: 'Sessão 1 - Introdução',
  descricao: 'Abertura do problema',
  data: '2026-10-15',
  ordem: 1,
  status: 'agendada',
};

describe('ManageSessionCard', () => {
  it('renders session title and date', () => {
    render(<ManageSessionCard session={mockSession} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('Sessão 1 - Introdução')).toBeInTheDocument();
    expect(screen.getByText('2026-10-15')).toBeInTheDocument();
  });

  it('calls onEdit when pencil button is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();

    render(<ManageSessionCard session={mockSession} onEdit={onEdit} onDelete={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Editar Sessão 1 - Introdução' }));
    expect(onEdit).toHaveBeenCalledWith(mockSession);
  });

  it('calls onDelete when trash button is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    render(<ManageSessionCard session={mockSession} onEdit={vi.fn()} onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: 'Excluir Sessão 1 - Introdução' }));
    expect(onDelete).toHaveBeenCalledWith(mockSession);
  });
});
