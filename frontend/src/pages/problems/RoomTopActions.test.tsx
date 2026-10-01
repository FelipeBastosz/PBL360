import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { RoomTopActions } from './RoomTopActions';

describe('RoomTopActions', () => {
  it('renders both Relatório Final and Turma when user is professor', () => {
    render(
      <MemoryRouter>
        <RoomTopActions isProfessor={true} roomId="room-123" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: /relatório final/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /turma/i })).toBeInTheDocument();
  });

  it('renders only Turma and hides Relatório Final when user is not professor', () => {
    render(
      <MemoryRouter>
        <RoomTopActions isProfessor={false} roomId="room-123" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /turma/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /relatório final/i })).not.toBeInTheDocument();
  });
});
