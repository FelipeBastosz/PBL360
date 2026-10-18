import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { SessionActionGrid } from './SessionActionGrid';

describe('SessionActionGrid', () => {
  const basePath = '/turmas/room-1/problemas/prob-1/sessoes/sess-1';

  it('renders active action links when student evaluation is inactive', () => {
    render(
      <MemoryRouter>
        <SessionActionGrid basePath={basePath} isStudentEvalActive={false} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /chamada/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /avaliar alunos/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /fórmulas/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /histórico de avaliações/i })).toHaveAttribute(
      'href',
      `${basePath}/historico`,
    );
  });

  it('disables "Avaliar alunos" card with explanation when student evaluations are active', () => {
    render(
      <MemoryRouter>
        <SessionActionGrid basePath={basePath} isStudentEvalActive={true} />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('link', { name: /avaliar alunos/i })).not.toBeInTheDocument();

    expect(screen.getByText('Bloqueado')).toBeInTheDocument();
    expect(
      screen.getByText(/avaliações ativas. consulte e ajuste no histórico de avaliações/i),
    ).toBeInTheDocument();
  });
});
