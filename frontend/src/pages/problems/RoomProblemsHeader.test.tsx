import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userService } from '@/services/user.service';
import { RoomProblemsHeader } from './RoomProblemsHeader';

vi.mock('@/services/user.service');

afterEach(() => {
  vi.resetAllMocks();
});

const professor = { id: 'tutor-1', nome: 'Professor Silva', possuiFoto: false };

const roomName = 'MI - Algoritmos - TP02';

describe('RoomProblemsHeader', () => {
  it('splits and renders discipline and class code from room name', () => {
    render(
      <MemoryRouter>
        <RoomProblemsHeader roomName={roomName} user={professor} />
      </MemoryRouter>,
    );

    expect(screen.getByText('MI - Algoritmos')).toBeInTheDocument();
    expect(screen.getByText('TP02')).toBeInTheDocument();
    expect(screen.getByText('PS')).toBeInTheDocument(); // Iniciais do usuário
    expect(screen.getByRole('link', { name: /voltar para as turmas/i })).toBeInTheDocument();
  });

  it('renders fallback title when the room name is not loaded yet', () => {
    render(
      <MemoryRouter>
        <RoomProblemsHeader user={{ ...professor, nome: 'Fulano' }} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Turma')).toBeInTheDocument();
  });

  it('shows the photo of the signed-in user when they have one', async () => {
    vi.mocked(userService.getPhoto).mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
    render(
      <MemoryRouter>
        <RoomProblemsHeader roomName={roomName} user={{ ...professor, possuiFoto: true }} />
      </MemoryRouter>,
    );

    const photo = await screen.findByRole('img', { name: 'Foto de Professor Silva' });

    expect(photo.getAttribute('src')).toMatch(/^data:image\/png;base64,/);
    expect(userService.getPhoto).toHaveBeenCalledWith('tutor-1');
  });
});
