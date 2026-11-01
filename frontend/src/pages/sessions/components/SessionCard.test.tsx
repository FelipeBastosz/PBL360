import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { Session } from '@/types/session';
import { SessionCard } from './SessionCard';

const mockSession: Session = {
  id: 'sess-1',
  titulo: 'Sessão de Abertura',
  descricao: 'Primeira discussão do caso',
  data: '2026-10-15',
  ordem: 1,
  status: 'agendada',
};

describe('SessionCard', () => {
  it('renders formatted title with date and description', () => {
    render(
      <MemoryRouter>
        <SessionCard session={mockSession} roomId="room-1" problemId="prob-1" />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Sessão de Abertura · 15 out/i)).toBeInTheDocument();
    expect(screen.getByText('Primeira discussão do caso')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/turmas/room-1/problemas/prob-1/sessoes/sess-1',
    );
  });

  it('renders fallback text when description is missing', () => {
    const sessionWithoutDesc = { ...mockSession, descricao: null };

    render(
      <MemoryRouter>
        <SessionCard session={sessionWithoutDesc} roomId="room-1" problemId="prob-1" />
      </MemoryRouter>,
    );

    expect(screen.getByText('Sem descrição')).toBeInTheDocument();
  });

  it('renders formula name tag when session has an attached table', () => {
    const sessionWithTable = {
      ...mockSession,
      tabelaNome: 'Barema PBL — P1S1',
    };

    render(
      <MemoryRouter>
        <SessionCard session={sessionWithTable} roomId="room-1" problemId="prob-1" />
      </MemoryRouter>,
    );

    expect(screen.getByText('Fórmula: Barema PBL — P1S1')).toBeInTheDocument();
  });
});
