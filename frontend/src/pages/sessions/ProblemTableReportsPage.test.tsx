import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/contexts/authContext';
import { problemService } from '@/services/problem.service';
import { roomService } from '@/services/room.service';
import { sessionService } from '@/services/session.service';
import type { UserResponse } from '@/types/auth';
import type { Problem } from '@/types/problem';
import type { Room } from '@/types/room';
import type { Session, SessionAttachment } from '@/types/session';
import { triggerBlobDownload } from '@/utils/download';
import ProblemTableReportsPage from './ProblemTableReportsPage';

vi.mock('@/services/room.service', () => ({
  roomService: { getById: vi.fn(), listMyRooms: vi.fn() },
}));
vi.mock('@/services/problem.service', () => ({
  problemService: { getById: vi.fn(), list: vi.fn() },
}));
vi.mock('@/services/session.service', () => ({
  sessionService: {
    list: vi.fn(),
    listForRoom: vi.fn(),
    listAttachments: vi.fn(),
    downloadAttachment: vi.fn(),
  },
}));
vi.mock('@/utils/download', () => ({
  triggerBlobDownload: vi.fn(),
}));
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: vi.fn() }),
}));

const mockTeacher: UserResponse = {
  id: '1',
  nome: 'Professor Silva',
  email: 'prof@test.com',
  tipo: 'PROFESSOR',
  matricula: null,
  possuiFoto: false,
  ativo: true,
  criadoEm: '2026-01-01',
};

const mockStudent: UserResponse = {
  id: '2',
  nome: 'Aluno Ciclano',
  email: 'aluno@test.com',
  tipo: 'ALUNO',
  matricula: '123456',
  possuiFoto: false,
  ativo: true,
  criadoEm: '2026-01-01',
};

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
  titulo: 'Problema 01',
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

const sessionTwo: Session = {
  id: 'sess-2',
  titulo: 'Segunda sessão',
  descricao: null,
  data: '19-08-2026',
  ordem: 2,
  status: 'agendada',
};

const sessionOne: Session = {
  id: 'sess-1',
  titulo: 'Primeira sessão',
  descricao: null,
  data: '12-08-2026',
  ordem: 1,
  status: 'agendada',
};

const tableReport: SessionAttachment = {
  id: 'att-1',
  nomeArquivo: 'Relatorio_Mesa_S1.pdf',
  tipo: 'application/pdf',
  tamanho: 1024,
  categoria: 'RELATORIO_MESA',
  enviadoPor: { id: '2', nome: 'Ana Souza' },
  enviadoEm: '2026-08-12T10:00:00.000Z',
};

const regularAttachment: SessionAttachment = {
  id: 'att-2',
  nomeArquivo: 'Roteiro_Geral.pdf',
  tipo: 'application/pdf',
  tamanho: 2048,
  categoria: 'ANEXO_SESSAO',
  enviadoPor: { id: '1', nome: 'Professor Silva' },
  enviadoEm: '2026-08-12T11:00:00.000Z',
};

function renderPage(user: UserResponse = mockTeacher) {
  return render(
    <AuthContext.Provider value={{ user, isAuthenticated: true, login: vi.fn(), logout: vi.fn() }}>
      <MemoryRouter initialEntries={['/turmas/room-1/problemas/prob-1/relatorios-mesa']}>
        <Routes>
          <Route
            path="/turmas/:roomId/problemas/:problemId/relatorios-mesa"
            element={<ProblemTableReportsPage />}
          />
          <Route
            path="/turmas/:roomId/problemas/:problemId/sessoes/:sessionId"
            element={<p>Hub da Sessão</p>}
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('ProblemTableReportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(roomService.getById).mockResolvedValue(mockRoom);
    vi.mocked(problemService.getById).mockResolvedValue(mockProblem);
    vi.mocked(sessionService.list).mockResolvedValue([sessionTwo, sessionOne]);
    vi.mocked(sessionService.listAttachments).mockImplementation(async (sessionId) => {
      if (sessionId === 'sess-1') return [tableReport, regularAttachment];
      return [];
    });
  });

  it('orders sessions by ordem, filters only RELATORIO_MESA, and shows empty state', async () => {
    renderPage(mockTeacher);

    const headings = await screen.findAllByRole('heading', { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual([
      'Primeira sessão · 12 ago',
      'Segunda sessão · 19 ago',
    ]);

    expect(screen.getByText('Relatorio_Mesa_S1.pdf')).toBeInTheDocument();
    expect(screen.queryByText('Roteiro_Geral.pdf')).not.toBeInTheDocument();
    expect(screen.getByText('Nenhum relatório de mesa anexado nesta sessão.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /excluir/i })).not.toBeInTheDocument();
  });

  it('downloads a table report and links directly to the session', async () => {
    const user = userEvent.setup();
    const blob = new Blob(['%PDF-1.4'], { type: 'application/pdf' });
    vi.mocked(sessionService.downloadAttachment).mockResolvedValue(blob);

    renderPage(mockTeacher);

    const downloadButton = await screen.findByRole('button', {
      name: /baixar relatorio_mesa_s1\.pdf/i,
    });
    await user.click(downloadButton);

    expect(sessionService.downloadAttachment).toHaveBeenCalledWith('sess-1', 'att-1');
    expect(triggerBlobDownload).toHaveBeenCalledWith(blob, 'Relatorio_Mesa_S1.pdf');

    const firstSection = screen.getByRole('region', { name: /primeira sessão/i });
    const sessionLink = within(firstSection).getByRole('link', { name: /abrir sessão/i });
    expect(sessionLink).toHaveAttribute('href', '/turmas/room-1/problemas/prob-1/sessoes/sess-1');

    await user.click(sessionLink);
    expect(await screen.findByText('Hub da Sessão')).toBeInTheDocument();
  });

  it('works for students using student routes and orders sessions by ordem', async () => {
    vi.mocked(roomService.listMyRooms).mockResolvedValue([
      { salaId: 'room-1', nome: 'MI - Algoritmos - TP02', semestre: '2026.2', totalAlunos: 3 },
    ]);
    vi.mocked(problemService.list).mockResolvedValue([mockProblem]);
    vi.mocked(sessionService.listForRoom).mockResolvedValue([
      {
        ...sessionTwo,
        problemaId: 'prob-1',
        problemaTitulo: 'Problema 01',
      },
      {
        ...sessionOne,
        problemaId: 'prob-1',
        problemaTitulo: 'Problema 01',
      },
    ]);

    renderPage(mockStudent);

    const headings = await screen.findAllByRole('heading', { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual([
      'Primeira sessão · 12 ago',
      'Segunda sessão · 19 ago',
    ]);
    expect(screen.getByText('Relatorio_Mesa_S1.pdf')).toBeInTheDocument();
    expect(sessionService.list).not.toHaveBeenCalled();
  });
});
