import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { classReportService } from '@/services/class-report.service';
import { ApiError } from '@/services/apiError';
import { ClassReportPage } from './ClassReportPage';

const mockNotify = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: mockNotify }),
}));

function renderPage(roomId = 'room-1') {
  return render(
    <MemoryRouter initialEntries={[`/turmas/${roomId}/relatorio-final`]}>
      <Routes>
        <Route path="/turmas/:id/relatorio-final" element={<ClassReportPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ClassReportPage', () => {
  let getFinalReportSpy: ReturnType<typeof vi.spyOn>;
  let exportFinalReportSpy: ReturnType<typeof vi.spyOn>;

  const mockReport = {
    sala: {
      id: 'room-1',
      nome: 'Engenharia de Software',
      codigoDisciplina: 'EXA123',
      semestre: '2026.2',
    },
    problemas: [{ id: 'prob-1', titulo: 'Problema 1 - Prontuário', ordem: 1 }],
    alunos: [
      {
        id: 'student-1',
        nome: 'Ana Souza',
        matricula: '20260001',
        mediaGeral: 8.5,
        isParcial: false,
        notasProblemas: [{ problemaId: 'prob-1', notaFinal: 8.5 }],
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    getFinalReportSpy = vi.spyOn(classReportService, 'getFinalReport');
    exportFinalReportSpy = vi
      .spyOn(classReportService, 'exportFinalReport')
      .mockResolvedValue(new Blob(['content']));
    localStorage.clear();

    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    window.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    getFinalReportSpy.mockRestore();
    exportFinalReportSpy.mockRestore();
    localStorage.clear();
  });

  it('renders loading spinner while fetching report', () => {
    getFinalReportSpy.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText('Carregando relatório final...')).toBeInTheDocument();
  });

  it('renders error state with retry button on failure', async () => {
    const user = userEvent.setup();
    getFinalReportSpy
      .mockRejectedValueOnce(new ApiError(500, ['Erro ao gerar relatório']))
      .mockResolvedValueOnce(mockReport);

    renderPage();

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Falha ao carregar relatório')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: 'Tentar novamente' });
    await user.click(retryBtn);

    expect(await screen.findByText('Ana Souza')).toBeInTheDocument();
  });

  it('downloads PDF report when clicking "Exportar em PDF"', async () => {
    const user = userEvent.setup();
    const fakeBlob = new Blob(['pdf-content'], { type: 'application/pdf' });
    exportFinalReportSpy.mockResolvedValueOnce(fakeBlob);
    getFinalReportSpy.mockResolvedValue(mockReport);

    renderPage('room-1');

    const pdfBtn = await screen.findByRole('button', { name: 'Exportar em PDF' });
    await user.click(pdfBtn);

    expect(exportFinalReportSpy).toHaveBeenCalledWith('room-1', 'PDF');
    expect(window.URL.createObjectURL).toHaveBeenCalledWith(fakeBlob);
  });

  it('downloads Excel report when clicking "Exportar em Excel"', async () => {
    const user = userEvent.setup();
    const fakeBlob = new Blob(['xlsx-content'], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    exportFinalReportSpy.mockResolvedValueOnce(fakeBlob);
    getFinalReportSpy.mockResolvedValue(mockReport);

    renderPage('room-1');

    const excelBtn = await screen.findByRole('button', { name: 'Exportar em Excel' });
    await user.click(excelBtn);

    expect(exportFinalReportSpy).toHaveBeenCalledWith('room-1', 'XLSX');
    expect(window.URL.createObjectURL).toHaveBeenCalledWith(fakeBlob);
  });

  it('shows error toast when export fails', async () => {
    const user = userEvent.setup();
    exportFinalReportSpy.mockRejectedValueOnce(new Error('Erro na exportação'));
    getFinalReportSpy.mockResolvedValue(mockReport);

    renderPage('room-1');

    const pdfBtn = await screen.findByRole('button', { name: 'Exportar em PDF' });
    await user.click(pdfBtn);

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith({
        tone: 'error',
        message: 'Ocorreu um erro inesperado. Tente novamente.',
      });
    });
  });

  it('toggles name privacy between student name and registration number', async () => {
    const user = userEvent.setup();
    getFinalReportSpy.mockResolvedValue(mockReport);

    renderPage();

    expect(await screen.findByText('Ana Souza')).toBeInTheDocument();
    const toggle = screen.getByRole('switch', { name: 'Ocultar nomes' });
    await user.click(toggle);

    expect(screen.getByText('20260001')).toBeInTheDocument();
    expect(screen.queryByText('Ana Souza')).not.toBeInTheDocument();
  });
});
