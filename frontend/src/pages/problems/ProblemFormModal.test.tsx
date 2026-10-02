import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { problemService } from '@/services/problem.service';
import type { Problem } from '@/types/problem';
import { ProblemFormModal } from './ProblemFormModal';

vi.mock('@/services/problem.service', () => ({
  problemService: {
    create: vi.fn(),
    update: vi.fn(),
  },
}));

describe('ProblemFormModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const roomId = 'room-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Creation Mode (without initialData)', () => {
    it('renders creation UI', () => {
      render(
        <ProblemFormModal
          isOpen={true}
          roomId={roomId}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      expect(screen.getByRole('heading', { name: 'Criar Problema' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Criar Problema' })).toBeInTheDocument();
      expect(screen.getByLabelText('Título do Problema')).toHaveValue('');
    });

    it('calls create API on valid submit', async () => {
      const user = userEvent.setup();
      const mockResult = { id: 'prob-1', titulo: 'Novo' } as Problem;
      vi.mocked(problemService.create).mockResolvedValue(mockResult);

      render(
        <ProblemFormModal
          isOpen={true}
          roomId={roomId}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      await user.type(screen.getByLabelText('Título do Problema'), 'Novo');
      await user.click(screen.getByRole('button', { name: 'Criar Problema' }));

      await waitFor(() => {
        expect(problemService.create).toHaveBeenCalledWith(roomId, { titulo: 'Novo' });
        expect(mockOnSuccess).toHaveBeenCalledWith(mockResult);
      });
    });
  });

  describe('Edition Mode (with initialData)', () => {
    const existingProblem = { id: 'prob-99', titulo: 'Antigo Titulo' } as Problem;

    it('renders edition UI and pre-fills input', () => {
      render(
        <ProblemFormModal
          isOpen={true}
          roomId={roomId}
          initialData={existingProblem}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      expect(screen.getByRole('heading', { name: 'Editar Problema' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeInTheDocument();
      expect(screen.getByLabelText('Título do Problema')).toHaveValue('Antigo Titulo');
    });

    it('calls update API on valid submit', async () => {
      const user = userEvent.setup();
      const mockResult = { id: 'prob-99', titulo: 'Titulo Editado' } as Problem;
      vi.mocked(problemService.update).mockResolvedValue(mockResult);

      render(
        <ProblemFormModal
          isOpen={true}
          roomId={roomId}
          initialData={existingProblem}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      const input = screen.getByLabelText('Título do Problema');
      await user.clear(input);
      await user.type(input, 'Titulo Editado');
      await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

      await waitFor(() => {
        expect(problemService.update).toHaveBeenCalledWith(roomId, 'prob-99', {
          title: 'Titulo Editado',
        });
        expect(mockOnSuccess).toHaveBeenCalledWith(mockResult);
      });
    });
  });

  describe('Common Validation and Errors', () => {
    it('shows validation error and prevents submission if title is empty', async () => {
      const user = userEvent.setup();
      render(
        <ProblemFormModal
          isOpen={true}
          roomId={roomId}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      await user.click(screen.getByRole('button', { name: 'Criar Problema' }));

      expect(screen.getByText('O título do problema é obrigatório.')).toBeInTheDocument();
      expect(problemService.create).not.toHaveBeenCalled();
    });

    it('shows API error alert if submission fails', async () => {
      const user = userEvent.setup();
      vi.mocked(problemService.create).mockRejectedValue(new Error('Erro no banco'));

      render(
        <ProblemFormModal
          isOpen={true}
          roomId={roomId}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      await user.type(screen.getByLabelText('Título do Problema'), 'Valido');
      await user.click(screen.getByRole('button', { name: 'Criar Problema' }));

      expect(await screen.findByRole('alert')).toBeInTheDocument();
    });
  });
});
