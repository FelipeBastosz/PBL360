import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { observationService } from '@/services/observation.service';
import { StudentObservationTagsPage } from './StudentObservationTagsPage';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { nome: 'Professor Silva', tipo: 'PROFESSOR' } }),
}));

vi.mock('@/services/observation.service');

const mockTags = [
  { id: 't1', nome: 'Celular fora de contexto' },
  { id: 't2', nome: 'Atraso' },
];

describe('StudentObservationTagsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(observationService.listTags).mockResolvedValue(mockTags);
    vi.mocked(observationService.listStudentObservations).mockResolvedValue({
      observacoes: [],
      contagem: {},
    });
  });

  function renderPage(sessionId = 's1', studentId = 'st1') {
    return render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: `/sessoes/${sessionId}/avaliacao/${studentId}/marcacoes`,
            state: { studentName: 'Ana Souza' },
          },
        ]}
      >
        <Routes>
          <Route
            path="/sessoes/:sessionId/avaliacao/:studentId/marcacoes"
            element={<StudentObservationTagsPage />}
          />
        </Routes>
      </MemoryRouter>,
    );
  }

  it('renders list of all available tags with marking buttons', async () => {
    renderPage();

    expect(await screen.findByText('Celular fora de contexto')).toBeInTheDocument();
    expect(screen.getByText('Atraso')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /criar nova marcação/i })).toBeInTheDocument();
  });

  it('creates and marks a new custom tag', async () => {
    const createdTag = { id: 't3', nome: 'Iniciativa' };
    vi.mocked(observationService.createTag).mockResolvedValue(createdTag);
    vi.mocked(observationService.registerObservation).mockResolvedValue({} as never);

    renderPage();

    await screen.findByRole('button', { name: /criar nova marcação/i });
    await userEvent.click(screen.getByRole('button', { name: /criar nova marcação/i }));

    const input = screen.getByPlaceholderText('Nome da nova marcação');
    await userEvent.type(input, 'Iniciativa');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(observationService.createTag).toHaveBeenCalledWith('Iniciativa');
      expect(observationService.registerObservation).toHaveBeenCalledWith('s1', 'st1', {
        marcacaoIds: ['t3'],
      });
    });
  });
});
