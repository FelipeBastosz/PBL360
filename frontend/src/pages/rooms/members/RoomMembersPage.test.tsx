import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/contexts/authContext';
import { ApiError } from '@/services/apiError';
import { roomService } from '@/services/room.service';
import { userService } from '@/services/user.service';
import type { UserResponse } from '@/types/auth';
import type { Room, RoomStudent, RoomTutor } from '@/types/room';
import RoomMembersPage from './RoomMembersPage';

vi.mock('@/services/room.service', () => ({
  roomService: {
    getById: vi.fn(),
    listStudents: vi.fn(),
    listTutors: vi.fn(),
    listMyRooms: vi.fn(),
  },
}));

vi.mock('@/services/user.service', () => ({
  userService: { getPhoto: vi.fn() },
}));

const tutor: UserResponse = {
  id: 't1',
  nome: 'Paula Freitas',
  email: 'paula@uefs.br',
  tipo: 'PROFESSOR',
  matricula: null,
  possuiFoto: false,
  ativo: true,
  criadoEm: '2026-01-01',
};

const student: UserResponse = { ...tutor, id: 's9', tipo: 'ALUNO', matricula: '20240001' };

const room = { id: 'room-1', nome: 'MI - Algoritmos - TP02' } as Room;

const students: RoomStudent[] = [
  {
    id: 's1',
    nome: 'Ana Silva Santos',
    email: '20231002@discente.uefs.br',
    matricula: '20231002',
    dataEntrada: '2026-09-01T15:00:00.000Z',
  },
  {
    id: 's2',
    nome: 'João Pedro Lima',
    email: '20231003@discente.uefs.br',
    matricula: '20231003',
    dataEntrada: '2026-09-02T15:00:00.000Z',
  },
];

const tutors: RoomTutor[] = [
  { id: 't1', nome: 'Paula Freitas', email: 'paula@uefs.br', responsavel: true },
  { id: 't2', nome: 'Bruno Reis', email: 'bruno@uefs.br', responsavel: false },
];

function renderPage(user: UserResponse = tutor) {
  return render(
    <AuthContext.Provider value={{ user, isAuthenticated: true, login: vi.fn(), logout: vi.fn() }}>
      <MemoryRouter initialEntries={['/turmas/room-1/participantes']}>
        <Routes>
          <Route path="/turmas/:id/participantes" element={<RoomMembersPage />} />
          <Route path="/turmas/:id/problemas" element={<p>Página da turma</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('RoomMembersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(roomService.getById).mockResolvedValue(room);
    vi.mocked(roomService.listStudents).mockResolvedValue(students);
    vi.mocked(roomService.listTutors).mockResolvedValue(tutors);
    vi.mocked(userService.getPhoto).mockRejectedValue(new ApiError(404, ['Foto não encontrada.']));
  });

  it('lists the students first and the tutors below them', async () => {
    renderPage();

    const studentsSection = await screen.findByRole('region', { name: 'Alunos' });
    const tutorsSection = screen.getByRole('region', { name: 'Professores' });

    expect(screen.getByRole('heading', { name: 'MI - Algoritmos' })).toBeInTheDocument();
    expect(within(studentsSection).getByText('Ana')).toBeInTheDocument();
    expect(within(studentsSection).getByText('João')).toBeInTheDocument();
    expect(within(tutorsSection).getByText('Bruno')).toBeInTheDocument();
    expect(within(tutorsSection).getByText('Responsável')).toBeInTheDocument();
    expect(
      studentsSection.compareDocumentPosition(tutorsSection) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('shows the student details in a popup', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole('button', { name: 'Ver detalhes de Ana Silva Santos' }),
    );

    const dialog = screen.getByRole('dialog', { name: 'Detalhes do Aluno' });
    expect(within(dialog).getByText('Ana Silva Santos')).toBeInTheDocument();
    expect(within(dialog).getByText('20231002')).toBeInTheDocument();
    expect(within(dialog).getByText('20231002@discente.uefs.br')).toBeInTheDocument();
    expect(within(dialog).getByText('01/09/2026')).toBeInTheDocument();
  });

  it('loads every student photo for a tutor', async () => {
    renderPage();
    await screen.findByText('Ana');

    expect(userService.getPhoto).toHaveBeenCalledWith('s1');
    expect(userService.getPhoto).toHaveBeenCalledWith('s2');
  });

  it('shows the tutor details without any performance score', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Ver detalhes de Bruno Reis' }));

    const dialog = screen.getByRole('dialog', { name: 'Detalhes do Professor' });
    expect(within(dialog).getByText('bruno@uefs.br')).toBeInTheDocument();
    expect(within(dialog).getByText('Professor associado')).toBeInTheDocument();
    expect(within(dialog).queryByText(/desempenho/i)).not.toBeInTheDocument();
  });

  it('filters students and tutors by name, ignoring accents', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Ana');

    await user.type(screen.getByRole('textbox', { name: 'Buscar por nome' }), 'joao');

    expect(screen.getByText('João')).toBeInTheDocument();
    expect(screen.queryByText('Ana')).not.toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Professores' })).getByText(
        'Ninguém encontrado com esse nome.',
      ),
    ).toBeInTheDocument();
  });

  it('shows the API error when the members cannot be loaded', async () => {
    vi.mocked(roomService.listStudents).mockRejectedValue(
      new ApiError(403, ['Você não tem permissão para acessar ou modificar esta sala.']),
    );
    renderPage();

    expect(
      await screen.findByText('Você não tem permissão para acessar ou modificar esta sala.'),
    ).toBeInTheDocument();
  });

  describe('when a student opens it', () => {
    const classmate = { ...student, id: 's2', nome: 'João Pedro Lima' };

    beforeEach(() => {
      vi.mocked(roomService.listMyRooms).mockResolvedValue([
        { salaId: 'room-1', nome: 'MI - Algoritmos - TP02', semestre: '2026.2', totalAlunos: 2 },
      ]);
    });

    it('lists the classmates and the room tutors', async () => {
      renderPage(classmate);

      const studentsSection = await screen.findByRole('region', { name: 'Alunos' });
      const tutorsSection = screen.getByRole('region', { name: 'Professores' });
      expect(within(studentsSection).getByText('Ana')).toBeInTheDocument();
      expect(within(studentsSection).getByText('João')).toBeInTheDocument();
      expect(within(tutorsSection).getByText('Bruno')).toBeInTheDocument();
      expect(within(tutorsSection).getByText('Responsável')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'MI - Algoritmos' })).toBeInTheDocument();
      expect(roomService.listStudents).toHaveBeenCalledWith('room-1');
      expect(roomService.listTutors).toHaveBeenCalledWith('room-1');
      expect(roomService.getById).not.toHaveBeenCalled();
    });

    it('opens a tutor details popup', async () => {
      const user = userEvent.setup();
      renderPage(classmate);

      await user.click(await screen.findByRole('button', { name: 'Ver detalhes de Bruno Reis' }));

      const dialog = screen.getByRole('dialog', { name: 'Detalhes do Professor' });
      expect(within(dialog).getByText('bruno@uefs.br')).toBeInTheDocument();
    });

    it('opens a classmate details popup', async () => {
      const user = userEvent.setup();
      renderPage(classmate);

      await user.click(
        await screen.findByRole('button', { name: 'Ver detalhes de Ana Silva Santos' }),
      );

      const dialog = screen.getByRole('dialog', { name: 'Detalhes do Aluno' });
      expect(within(dialog).getByText('20231002')).toBeInTheDocument();
    });

    it('only loads the photo of the student who is signed in', async () => {
      renderPage(classmate);
      await screen.findByText('Ana');

      expect(userService.getPhoto).toHaveBeenCalledWith('s2');
      expect(userService.getPhoto).not.toHaveBeenCalledWith('s1');
    });
  });
});
