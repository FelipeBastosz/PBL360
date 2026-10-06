import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { Room } from '@/types/room';
import type { Problem } from '@/types/problem';
import { ProblemSessionsHeader } from './ProblemSessionsHeader';

const mockRoom: Room = {
  id: 'room-1',
  nome: 'MI - Algoritmos - TP02',
  codigoDisciplina: 'EXA801',
  codigoSala: 'aB7kP2x9',
  semestre: '2026.2',
  ativo: true,
  criadoEm: '2026-01-01',
  professorResponsavelId: '1',
};

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

describe('ProblemSessionsHeader', () => {
  it('renders problem title, room class and user initials', () => {
    render(
      <MemoryRouter>
        <ProblemSessionsHeader room={mockRoom} problem={mockProblem} userNome="Professor Silva" />
      </MemoryRouter>,
    );

    expect(screen.getByText('Problema 01 - Diagnóstico')).toBeInTheDocument();
    expect(screen.getByText('TP02')).toBeInTheDocument();
    expect(screen.getByText('PS')).toBeInTheDocument(); // Iniciais
    expect(screen.getByRole('link', { name: /voltar para os problemas/i })).toHaveAttribute(
      'href',
      '/turmas/room-1/problemas',
    );
  });

  it('renders fallback title when problem is null', () => {
    render(
      <MemoryRouter>
        <ProblemSessionsHeader room={null} problem={null} userNome="Fulano" />
      </MemoryRouter>,
    );

    expect(screen.getByText('Problema')).toBeInTheDocument();
  });
});
