import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { SessionReleasesResponse } from '@/types/session';
import { SessionEvaluationsCard } from './SessionEvaluationsCard';

const mockReleases: SessionReleasesResponse = {
  autoavaliacao: {
    liberada: true,
    prazo: '2026-10-15T17:00:00.000Z',
    enviadas: 3, 
  },
  pares: {
    liberada: true,
    prazo: '2026-10-15T17:00:00.000Z',
    enviadas: 8, 
    esperadas: 20, 
  },
  atualizadoEm: '2026-10-01T10:00:00.000Z',
  atualizadoPor: 'tutor-1',
};

describe('SessionEvaluationsCard', () => {
  it('renders adherence stats per student count and formatted deadline', () => {
    render(
      <SessionEvaluationsCard
        releases={mockReleases}
        onToggle={vi.fn()}
        isAttendancePending={false}
        isLoading={false}
      />,
    );

    expect(screen.getByText('3 de 5 alunos enviaram')).toBeInTheDocument();

    expect(screen.getByText('2 de 5 alunos enviaram')).toBeInTheDocument();

    expect(screen.getAllByText(/Até 15\/10\/2026 às/)).toHaveLength(2);
  });

  it('calls onToggle when clicking the switches', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(
      <SessionEvaluationsCard
        releases={mockReleases}
        onToggle={onToggle}
        isAttendancePending={false}
        isLoading={false}
      />,
    );

    await user.click(screen.getByRole('switch', { name: 'Autoavaliação dos alunos' }));
    expect(onToggle).toHaveBeenCalledWith('autoavaliacao');

    await user.click(screen.getByRole('switch', { name: 'Avaliação entre pares' }));
    expect(onToggle).toHaveBeenCalledWith('pares');
  });

  it('locks switches and displays warning when attendance is pending', () => {
    render(
      <SessionEvaluationsCard
        releases={mockReleases}
        onToggle={vi.fn()}
        isAttendancePending={true}
        isLoading={false}
      />,
    );

    expect(screen.getByText(/salve a chamada da sessão primeiro/i)).toBeInTheDocument();
    expect(screen.getAllByRole('switch')[0]).toBeDisabled();
    expect(screen.getAllByRole('switch')[1]).toBeDisabled();
  });
});