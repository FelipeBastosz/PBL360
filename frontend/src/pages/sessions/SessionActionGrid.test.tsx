import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { SessionActionGrid } from './SessionActionGrid';

describe('SessionActionGrid', () => {
  const basePath = '/turmas/room-1/problemas/prob-1/sessoes/sess-1';

  it('renders active action links with correct destination routes', () => {
    render(
      <MemoryRouter>
        <SessionActionGrid basePath={basePath} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /chamada/i })).toHaveAttribute(
      'href',
      `${basePath}/chamada`,
    );
    expect(screen.getByRole('link', { name: /avaliar alunos/i })).toHaveAttribute(
      'href',
      `${basePath}/avaliar`,
    );
    expect(screen.getByRole('link', { name: /fórmulas/i })).toHaveAttribute(
      'href',
      `${basePath}/formulas`,
    );
  });

  it('renders disabled card for Histórico de avaliações with Em breve badge', () => {
    render(
      <MemoryRouter>
        <SessionActionGrid basePath={basePath} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Histórico de avaliações')).toBeInTheDocument();
    expect(screen.getByText('Em breve')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /histórico de avaliações/i }),
    ).not.toBeInTheDocument();
  });
});
