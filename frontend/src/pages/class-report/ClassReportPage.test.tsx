import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { classReportService } from '@/services/class-report.service';
import { ApiError } from '@/services/apiError';
import { ClassReportPage } from './ClassReportPage';

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
    getFinalReportSpy = vi.spyOn(classReportService, 'getFinalReport');
    localStorage.clear();
  });

  afterEach(() => {
    getFinalReportSpy.mockRestore();
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

  it('renders empty state when there are no problems in the room', async () => {
    getFinalReportSpy.mockResolvedValueOnce({
      ...mockReport,
      problemas: [],
      alunos: [],
    });

    renderPage();

    expect(await screen.findByText('Nenhum problema registrado nesta turma.')).toBeInTheDocument();
  });

  it('renders empty state when there are no students in the room', async () => {
    getFinalReportSpy.mockResolvedValueOnce({
      ...mockReport,
      problemas: [{ id: 'p1', titulo: 'Prob 1', ordem: 1 }],
      alunos: [],
    });

    renderPage();

    expect(await screen.findByText('Não há alunos vinculados a esta turma.')).toBeInTheDocument();
  });

  it('renders table, export buttons, and header when report data is loaded', async () => {
    const user = userEvent.setup();
    getFinalReportSpy.mockResolvedValue(mockReport);

    renderPage();

    expect(await screen.findByText('Relatório Final da Turma')).toBeInTheDocument();
    expect(screen.getByText('Engenharia de Software • 2026.2')).toBeInTheDocument();
    expect(screen.getByText('Ana Souza')).toBeInTheDocument();
    expect(screen.getAllByText('8,5')).toHaveLength(2);

    // Verify export buttons
    expect(screen.getByRole('button', { name: 'Exportar em PDF' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exportar em Excel' })).toBeInTheDocument();

    // Verify toggle hide names switches to matricula
    const toggle = screen.getByRole('switch', { name: 'Ocultar nomes' });
    await user.click(toggle);
    expect(screen.getByText('20260001')).toBeInTheDocument();
    expect(screen.queryByText('Ana Souza')).not.toBeInTheDocument();
  });
});
