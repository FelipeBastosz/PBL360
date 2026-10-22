import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { observationService } from '@/services/observation.service';
import type { BehaviorTag } from '@/types/observation';
import BehaviorTagsPage from './BehaviorTagsPage';

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

  it('renders list of tags with appropriate badges and actions', async () => {
    renderComponent();

    expect(screen.getByText('Minhas Marcações')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Atraso')).toBeInTheDocument();
      expect(screen.getByText('Padrão')).toBeInTheDocument();
      expect(screen.getByText('Liderou o grupo')).toBeInTheDocument();
      expect(screen.getByText('Personalizada')).toBeInTheDocument();
    });

    expect(
      screen.getByRole('button', { name: 'Editar marcação Liderou o grupo' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Excluir marcação Liderou o grupo' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Editar marcação Atraso' }),
    ).not.toBeInTheDocument();
  });

  it('renames an owned custom tag', async () => {
    vi.mocked(observationService.renameTag).mockResolvedValue({
      id: 'tag-2',
      nome: 'Liderou a discussão',
      predefinida: false,
      ativa: true,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Liderou o grupo')).toBeInTheDocument();
    });

    const editBtn = screen.getByRole('button', { name: 'Editar marcação Liderou o grupo' });
    await userEvent.click(editBtn);

    const input = screen.getByDisplayValue('Liderou o grupo');
    await userEvent.clear(input);
    await userEvent.type(input, 'Liderou a discussão');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(observationService.renameTag).toHaveBeenCalledWith('tag-2', 'Liderou a discussão');
      expect(screen.getByText('Liderou a discussão')).toBeInTheDocument();
    });
  });

  it('creates a new custom tag', async () => {
    vi.mocked(observationService.createTag).mockResolvedValue({
      id: 'tag-3',
      nome: 'Proatividade',
      predefinida: false,
      ativa: true,
    });

    renderComponent();

    const openBtn = await screen.findByRole('button', { name: /criar nova marcação/i });
    await userEvent.click(openBtn);

    const input = screen.getByPlaceholderText('Nome da marcação');
    await userEvent.type(input, 'Proatividade');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(observationService.createTag).toHaveBeenCalledWith('Proatividade');
      expect(screen.getByText('Proatividade')).toBeInTheDocument();
    });
  });

  it('deletes an owned custom tag', async () => {
    vi.mocked(observationService.deleteTag).mockResolvedValue(undefined);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Liderou o grupo')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByRole('button', { name: 'Excluir marcação Liderou o grupo' });
    await userEvent.click(deleteBtn);

    await waitFor(() => {
      expect(observationService.deleteTag).toHaveBeenCalledWith('tag-2');
      expect(screen.queryByText('Liderou o grupo')).not.toBeInTheDocument();
    });
  });
});
