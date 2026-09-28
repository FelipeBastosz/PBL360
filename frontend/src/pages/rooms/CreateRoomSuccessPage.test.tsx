import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CreateRoomSuccessPage from '@/pages/rooms/CreateRoomSuccessPage';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { nome: 'Fulano da Silva' } }),
}));

const writeTextMock = vi.fn();
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: writeTextMock },
  writable: true,
});

describe('CreateRoomSuccessPage', () => {
  const mockRoom = {
    id: 'room-123',
    roomCode: 'ABC-123',
    name: 'Turma Teste',
  } as const;

  const renderWithState = () =>
    render(
      <MemoryRouter initialEntries={[{ pathname: '/sala/sucesso', state: { room: mockRoom } }]}>
        <Routes>
          <Route path="/sala/sucesso" element={<CreateRoomSuccessPage />} />
        </Routes>
      </MemoryRouter>,
    );

  it('renderiza corretamente quando a sala está no state', () => {
    renderWithState();

    expect(screen.getByRole('heading', { level: 1, name: /turma criada/i })).toBeInTheDocument();

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /turma criada com sucesso!/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getAllByText(/abc-123/i)).toHaveLength(2);

    expect(screen.getByText('pbl360.com/salas/ABC-123')).toBeInTheDocument();
  });

  it('copia o código quando o botão de copiar código é clicado', async () => {
    renderWithState();
    const copyCodeBtn = screen.getAllByRole('button', {
      name: /copiar código/i,
    })[0];
    fireEvent.click(copyCodeBtn);
    await waitFor(() => expect(writeTextMock).toHaveBeenCalledWith('ABC-123'));
  });

  it('copia o link quando o botão de copiar link é clicado', async () => {
    renderWithState();
    const copyLinkBtn = screen.getAllByRole('button', {
      name: /copiar link/i,
    })[0];
    fireEvent.click(copyLinkBtn);
    await waitFor(() =>
      expect(writeTextMock).toHaveBeenCalledWith('https://pbl360.com/salas/ABC-123'),
    );
  });
});
