import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { Problem } from '@/types/problem';
import type { Session } from '@/types/session';
import { SessionHubHeader } from './SessionHubHeader';

const mockProblem: Problem = {
  id: 'prob-1',
  salaId: 'room-1',
  titulo: 'Problema 01 - Diagnóstico',
  descricao: null,
  ordem: 1,
  dataInicio: null,
  dataFim: null,
  tabelaId: null,
  autoavaliacaoLiberada: false,
  avaliacaoEntreParesLiberada: false,
  liberadoEm: null,
  prazoAutoavaliacao: null,
  criadoPor: 'tutor-1',
  criadoEm: '2026-01-01',
  atualizadoEm: '2026-01-01',
};

const mockSession: Session = {
  id: 'sess-1',
  titulo: 'Sessão 1',
  descricao: 'Primeiro encontro tutorial',
  data: '12-08-2026',
  ordem: 1,
  status: 'agendada',
};

describe('SessionHubHeader', () => {
  it('renders session title with formatted date, problem subtitle and initials', () => {
    render(
      <MemoryRouter>
        <SessionHubHeader
          session={mockSession}
          problem={mockProblem}
          userNome="Professor Silva"
          backUrl="/turmas/room-1/problemas/prob-1"
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Sessão 1 · 12 ago/i)).toBeInTheDocument();
    expect(screen.getByText('Problema 01 - Diagnóstico')).toBeInTheDocument();
    expect(screen.getByText('PS')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /voltar para as sessões/i })).toHaveAttribute(
      'href',
      '/turmas/room-1/problemas/prob-1',
    );
  });

  it('renders fallback title when session is null', () => {
    render(
      <MemoryRouter>
        <SessionHubHeader session={null} problem={null} userNome="Fulano" backUrl="/turmas" />
      </MemoryRouter>,
    );

    expect(screen.getByText('Sessão')).toBeInTheDocument();
  });
});
