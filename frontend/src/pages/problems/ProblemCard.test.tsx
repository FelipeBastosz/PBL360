import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { Problem } from '@/types/problem';
import { ProblemCard } from './ProblemCard';

const baseProblem: Problem = {
  id: 'prob-1',
  salaId: 'room-1',
  titulo: 'Problema 1 - Diagnóstico',
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

describe('ProblemCard', () => {
  it('renders problem title and navigates to problem route', () => {
    render(
      <MemoryRouter>
        <ProblemCard problem={baseProblem} roomId="room-1" />
      </MemoryRouter>,
    );

    expect(screen.getByText('Problema 1 - Diagnóstico')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/turmas/room-1/problemas/prob-1');
  });
});
