import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { Room } from '@/types/room';
import { RoomProblemsHeader } from './RoomProblemsHeader';

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

describe('RoomProblemsHeader', () => {
  it('splits and renders discipline and class code from room name', () => {
    render(
      <MemoryRouter>
        <RoomProblemsHeader room={mockRoom} userNome="Professor Silva" />
      </MemoryRouter>,
    );

    expect(screen.getByText('MI - Algoritmos')).toBeInTheDocument();
    expect(screen.getByText('TP02')).toBeInTheDocument();
    expect(screen.getByText('PS')).toBeInTheDocument(); // Iniciais do usuário
    expect(screen.getByRole('link', { name: /voltar para as turmas/i })).toBeInTheDocument();
  });

  it('renders fallback title when room is null', () => {
    render(
      <MemoryRouter>
        <RoomProblemsHeader room={null} userNome="Fulano" />
      </MemoryRouter>,
    );

    expect(screen.getByText('Turma')).toBeInTheDocument();
  });
});
