import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { Problem } from '@/types/problem';
import { ManageSessionsHeader } from './ManageSessionsHeader';

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

describe('ManageSessionsHeader', () => {
  it('renders problem title, user initials and back link', () => {
    render(
      <MemoryRouter>
        <ManageSessionsHeader
          problem={mockProblem}
          userNome="Professor Silva"
          backUrl="/turmas/room-1/problemas/prob-1"
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Problema 01 - Diagnóstico')).toBeInTheDocument();
    expect(screen.getByText('PS')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /voltar para as sessões/i })).toHaveAttribute(
      'href',
      '/turmas/room-1/problemas/prob-1',
    );
  });

  it('renders fallback title when problem is null', () => {
    render(
      <MemoryRouter>
        <ManageSessionsHeader problem={null} userNome="Fulano" backUrl="/turmas" />
      </MemoryRouter>,
    );

    expect(screen.getByText('Gerenciar Sessões')).toBeInTheDocument();
  });
});
