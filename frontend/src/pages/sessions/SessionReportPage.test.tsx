import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/contexts/authContext';
import { ToastContext } from '@/contexts/toastContext';
import { gradesService } from '@/services/grades.service';
import { sessionService } from '@/services/session.service';
import type { UserResponse } from '@/types/auth';
import type { Session } from '@/types/session';
import type { SessionReportStudent } from '@/types/sessionReport';
import { SessionReportPage } from './SessionReportPage';
import * as sessionStudentsModule from './useSessionReportStudents';

vi.mock('@/services/session.service', () => ({
  sessionService: {
    getById: vi.fn(),
    exportSessionReport: vi.fn(),
  },
}));

vi.mock('@/services/grades.service', () => ({
  gradesService: {
    getProblemGrades: vi.fn(),
  },
}));

const mockNotify = vi.fn();
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();

const mockTeacher: UserResponse = {
  id: '1',
  nome: 'Professor Fulano',
  email: 'prof@test.com',
  tipo: 'PROFESSOR',
  matricula: null,
  possuiFoto: false,
  ativo: true,
  criadoEm: '2026-01-01',
};

const mockSession: Session = {
  id: 'sess-1',
  titulo: 'Sessão 1 - Abertura',
  descricao: 'Primeiro encontro tutorial',
  data: '2026-10-01',
  ordem: 1,
  status: 'agendada',
};

const mockStudents: SessionReportStudent[] = [
  {
    id: 'student-1',
    nome: 'Ana Souza',
    matricula: '20240001',
    notaFinal: 6.5,
  },
  {
    id: 'student-2',
    nome: 'João Silva',
    matricula: '20240002',
    notaFinal: 8.0,
  },
  {
    id: 'student-3',
    nome: 'Carlos Lima',
    matricula: '20240003',
    notaFinal: null,
  },
];

function renderPage(
  initialEntry = '/turmas/room-1/problemas/prob-1/sessoes/sess-1/relatorio',
  students?: SessionReportStudent[],
) {
  return render(
    <AuthContext.Provider
      value={{
        user: mockTeacher,
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
      }}
    >
      <ToastContext.Provider value={{ notify: mockNotify }}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route
              path="/turmas/:roomId/problemas/:problemId/sessoes/:sessionId/relatorio"
              element={<SessionReportPage students={students} />}
            />
          </Routes>
        </MemoryRouter>
      </ToastContext.Provider>
    </AuthContext.Provider>,
  );
}

describe('SessionReportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sessionService.getById).mockResolvedValue(mockSession);
    vi.mocked(gradesService.getProblemGrades).mockResolvedValue({
      sessoes: [{ id: 'sess-1' }],
      alunos: [],
      mediaTurma: null,
      versoesFormula: { sessao: null, problema: null },
    });
    mockCreateObjectURL.mockReturnValue('blob:http://localhost/test-blob');
    window.URL.createObjectURL = mockCreateObjectURL;
    window.URL.revokeObjectURL = mockRevokeObjectURL;
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Cabeçalho', () => {
    it('renders fixed title "Relatório da Sessão" and session subtitle in AppHeader', async () => {
      renderPage();

      expect(
        await screen.findByRole('heading', {
          level: 1,
          name: 'Relatório da Sessão',
        }),
      ).toBeInTheDocument();
      expect(screen.getByText('Sessão 1 - Abertura')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /voltar para a sessão/i })).toHaveAttribute(
        'href',
        '/turmas/room-1/problemas/prob-1/sessoes/sess-1',
      );
    });

    it('renders session subtitle from location state immediately', async () => {
      render(
        <AuthContext.Provider
          value={{
            user: mockTeacher,
            isAuthenticated: true,
            login: vi.fn(),
            logout: vi.fn(),
          }}
        >
          <ToastContext.Provider value={{ notify: mockNotify }}>
            <MemoryRouter
              initialEntries={[
                {
                  pathname: '/turmas/room-1/problemas/prob-1/sessoes/sess-1/relatorio',
                  state: { sessionTitle: 'Sessão 1 - Abertura' },
                },
              ]}
            >
              <Routes>
                <Route
                  path="/turmas/:roomId/problemas/:problemId/sessoes/:sessionId/relatorio"
                  element={<SessionReportPage />}
                />
              </Routes>
            </MemoryRouter>
          </ToastContext.Provider>
        </AuthContext.Provider>,
      );

      expect(screen.getByText('Sessão 1 - Abertura')).toBeInTheDocument();
      await screen.findByRole('heading', { level: 1, name: 'Relatório da Sessão' });
    });
  });

  describe('Tabela de Notas', () => {
    it('renders initial table correctly with mock students, ALUNO header, and Ocultar nomes label', async () => {
      renderPage(undefined, mockStudents);

      expect(await screen.findByText('Sessão 1 - Abertura')).toBeInTheDocument();
      expect(screen.getByText('ALUNO')).toBeInTheDocument();
      expect(screen.getByText('NOTA FINAL')).toBeInTheDocument();
      expect(screen.getByText('Ocultar nomes')).toBeInTheDocument();
      expect(screen.getByText('Ana Souza')).toBeInTheDocument();
      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.getByText('Carlos Lima')).toBeInTheDocument();
    });

    it('toggles name masking to matricula when clicking Ocultar nomes switch', async () => {
      const user = userEvent.setup();
      renderPage(undefined, mockStudents);

      expect(await screen.findByText('Sessão 1 - Abertura')).toBeInTheDocument();
      const toggle = screen.getByRole('switch', { name: /ocultar nomes/i });
      await user.click(toggle);

      expect(screen.getByText('MATRÍCULA')).toBeInTheDocument();
      expect(screen.queryByText('ALUNO')).not.toBeInTheDocument();
      expect(screen.queryByText('Ana Souza')).not.toBeInTheDocument();
      expect(screen.queryByText('João Silva')).not.toBeInTheDocument();
      expect(screen.queryByText('Carlos Lima')).not.toBeInTheDocument();
      expect(screen.getByText('20240001')).toBeInTheDocument();
      expect(screen.getByText('20240002')).toBeInTheDocument();
      expect(screen.getByText('20240003')).toBeInTheDocument();
    });

    it('applies red color for grade < 7.0 and green color for grade >= 7.0 and neutral color for null grade', async () => {
      renderPage(undefined, mockStudents);

      expect(await screen.findByText('Sessão 1 - Abertura')).toBeInTheDocument();
      const lowGradeCell = screen.getByText('6,5');
      expect(lowGradeCell).toHaveClass('text-red-600');

      const highGradeCell = screen.getByText('8,0');
      expect(highGradeCell).toHaveClass('text-green-600');

      const nullGradeCell = screen.getByText('—');
      expect(nullGradeCell).toHaveClass('text-ink');
      expect(nullGradeCell).not.toHaveClass('text-red-600');
      expect(nullGradeCell).not.toHaveClass('text-green-600');
    });

    it('calculates and renders the mathematically correct class average in table footer, ignoring null grades', async () => {
      renderPage(undefined, mockStudents);

      expect(await screen.findByText('Sessão 1 - Abertura')).toBeInTheDocument();
      expect(screen.getByText('Média da turma')).toBeInTheDocument();
      // (6.5 + 8.0) / 2 = 7.25 -> formatGrade(7.25) = '7,3', ignoring Carlos Lima with null grade
      const avgCell = screen.getByText('7,3');
      expect(avgCell).toBeInTheDocument();
      expect(avgCell).toHaveClass('text-ink', 'font-bold');
      expect(avgCell).not.toHaveClass('text-green-600');
      expect(avgCell).not.toHaveClass('text-red-600');
    });

    it('fetches and maps real session students from the API when students prop is not provided', async () => {
      vi.mocked(gradesService.getProblemGrades).mockResolvedValue({
        sessoes: [{ id: 'sess-1' }],
        alunos: [
          {
            alunoId: 'aluno-real-1',
            nome: 'Beatriz Santos',
            matricula: '20241010',
            sessoes: [{ sessaoId: 'sess-1', nota: 8.5, situacao: 'AVALIADA' }],
            notaFinal: 8.5,
          },
          {
            alunoId: 'aluno-real-2',
            nome: 'Daniel Costa',
            matricula: '20241020',
            sessoes: [{ sessaoId: 'sess-1', nota: null, situacao: 'PENDENTE' }],
            notaFinal: null,
          },
        ],
        mediaTurma: 8.5,
        versoesFormula: { sessao: null, problema: null },
      });

      renderPage();

      expect(await screen.findByText('Beatriz Santos')).toBeInTheDocument();
      const gradeCells = screen.getAllByText('8,5');
      expect(gradeCells).toHaveLength(2);
      expect(gradeCells[0]).toHaveClass('text-green-600');
      expect(gradeCells[1]).toHaveClass('text-ink');
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('Exportação de Relatório', () => {
    it('downloads PDF report when clicking Exportar em PDF button', async () => {
      const user = userEvent.setup();
      const mockBlob = new Blob(['%PDF-1.4'], { type: 'application/pdf' });
      vi.mocked(sessionService.exportSessionReport).mockResolvedValue(mockBlob);

      renderPage(undefined, mockStudents);
      expect(await screen.findByText('Sessão 1 - Abertura')).toBeInTheDocument();

      const pdfButton = screen.getByRole('button', { name: /exportar em pdf/i });
      await user.click(pdfButton);

      expect(sessionService.exportSessionReport).toHaveBeenCalledWith('sess-1', 'PDF');
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/test-blob');
    });

    it('downloads Excel report when clicking Exportar em Excel button', async () => {
      const user = userEvent.setup();
      const mockBlob = new Blob(['mock-xlsx-data'], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      vi.mocked(sessionService.exportSessionReport).mockResolvedValue(mockBlob);

      renderPage(undefined, mockStudents);
      expect(await screen.findByText('Sessão 1 - Abertura')).toBeInTheDocument();

      const excelButton = screen.getByRole('button', { name: /exportar em excel/i });
      await user.click(excelButton);

      expect(sessionService.exportSessionReport).toHaveBeenCalledWith('sess-1', 'XLSX');
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/test-blob');
    });

    it('handles export failure by not downloading and notifying error toast from blob', async () => {
      const user = userEvent.setup();
      const errorBlob = new Blob([JSON.stringify({ message: 'Erro ao gerar relatório' })], {
        type: 'application/json',
      });
      const errorResponse = {
        response: {
          data: errorBlob,
          status: 400,
        },
      };
      vi.mocked(sessionService.exportSessionReport).mockRejectedValue(errorResponse);

      renderPage(undefined, mockStudents);
      expect(await screen.findByText('Sessão 1 - Abertura')).toBeInTheDocument();

      const pdfButton = screen.getByRole('button', { name: /exportar em pdf/i });
      await user.click(pdfButton);

      expect(sessionService.exportSessionReport).toHaveBeenCalledWith('sess-1', 'PDF');
      expect(mockCreateObjectURL).not.toHaveBeenCalled();
      expect(mockNotify).toHaveBeenCalledWith({
        tone: 'error',
        message: 'Erro ao gerar relatório',
      });
    });
  });

  describe('Empty State', () => {
    it('renders clean empty state and hides table and export actions when session has no students', async () => {
      vi.spyOn(sessionStudentsModule, 'useSessionReportStudents').mockReturnValue({
        students: [],
        isLoading: false,
      });

      renderPage();

      expect(await screen.findByText('Sessão 1 - Abertura')).toBeInTheDocument();
      expect(screen.getByText('Não há alunos vinculados a esta sessão.')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Assim que novos alunos entrarem na turma, as notas consolidadas aparecerão aqui.',
        ),
      ).toBeInTheDocument();

      expect(screen.queryByRole('switch', { name: /ocultar nomes/i })).not.toBeInTheDocument();
      expect(screen.queryByText('Ocultar nomes')).not.toBeInTheDocument();
      expect(screen.queryByText('ALUNO')).not.toBeInTheDocument();
      expect(screen.queryByText('MATRÍCULA')).not.toBeInTheDocument();
      expect(screen.queryByText('NOTA FINAL')).not.toBeInTheDocument();
      expect(screen.queryByText('Média da turma')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /exportar em pdf/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /exportar em excel/i })).not.toBeInTheDocument();
    });
  });
});
