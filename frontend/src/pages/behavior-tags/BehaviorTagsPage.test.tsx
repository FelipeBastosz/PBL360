import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { observationService } from '@/services/observation.service';
import type { BehaviorTag } from '@/types/observation';
import BehaviorTagsPage from './BehaviorTagsPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/services/observation.service');

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { nome: 'Professor Silva', tipo: 'PROFESSOR' } }),
}));

const mockNotify = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: mockNotify }),
}));

const mockTags: BehaviorTag[] = [
  { id: 'tag-1', nome: 'Atraso', predefinida: true, ativa: true },
  { id: 'tag-2', nome: 'Liderou o grupo', predefinida: false, ativa: true },
];

describe('BehaviorTagsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(observationService.listTags).mockResolvedValue(mockTags);
  });

  const renderComponent = () => {
    render(
      <MemoryRouter>
        <BehaviorTagsPage />
      </MemoryRouter>,
    );
  };

  it('renders only custom tags and omits predefined tags', async () => {
    renderComponent();

    expect(screen.getByText('Minhas Marcações')).toBeInTheDocument();
    expect(screen.getByLabelText('Pesquisar marcação')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Liderou o grupo')).toBeInTheDocument();
      expect(screen.queryByText('Atraso')).not.toBeInTheDocument();
    });

    expect(
      screen.getByRole('button', { name: 'Editar marcação Liderou o grupo' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Excluir marcação Liderou o grupo' }),
    ).toBeInTheDocument();
  });

  it('opens confirmation modal and deletes custom tag', async () => {
    vi.mocked(observationService.deleteTag).mockResolvedValue(undefined);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Liderou o grupo')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: 'Excluir marcação Liderou o grupo' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Excluir marcação?' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Sim, excluir marcação' }));

    await waitFor(() => {
      expect(observationService.deleteTag).toHaveBeenCalledWith('tag-2');
      expect(screen.queryByText('Liderou o grupo')).not.toBeInTheDocument();
    });
  });

  it('cancels deletion from the modal without calling the service', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Liderou o grupo')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: 'Excluir marcação Liderou o grupo' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(observationService.deleteTag).not.toHaveBeenCalled();
    expect(screen.getByText('Liderou o grupo')).toBeInTheDocument();
  });
});
