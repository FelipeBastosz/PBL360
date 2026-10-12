import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SetDeadlineModal, ConfirmLockModal } from './EvaluationReleaseModals';

describe('EvaluationReleaseModals', () => {
  describe('SetDeadlineModal', () => {
    it('renders modal and confirms without deadline when empty', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();

      render(
        <SetDeadlineModal
          isOpen={true}
          type="autoavaliacao"
          isLoading={false}
          onConfirm={onConfirm}
          onCancel={vi.fn()}
        />,
      );

      expect(screen.getByRole('heading', { name: 'Liberar Autoavaliação' })).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Confirmar liberação' }));

      expect(onConfirm).toHaveBeenCalledWith(null);
    });

    it('shows mutual exclusivity warning when other evaluation is already active', () => {
      render(
        <SetDeadlineModal
          isOpen={true}
          type="pares"
          activeOtherType="autoavaliacao"
          isLoading={false}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />,
      );

      expect(screen.getByText(/Autoavaliação/i, { selector: 'strong' })).toBeInTheDocument();

      expect(
        screen.getByText(/automaticamente desativada/i, { selector: 'strong' }),
      ).toBeInTheDocument();
    });
  });

  describe('ConfirmLockModal', () => {
    it('warns that existing submissions will be preserved when locking', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();

      render(
        <ConfirmLockModal
          isOpen={true}
          enviadas={5}
          isLoading={false}
          onConfirm={onConfirm}
          onCancel={vi.fn()}
        />,
      );

      expect(
        screen.getByText(
          (_, element) =>
            element?.tagName.toLowerCase() === 'p' &&
            /5\s*alunos já enviaram suas respostas/i.test(element.textContent ?? ''),
        ),
      ).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Sim, desativar e bloquear' }));
      expect(onConfirm).toHaveBeenCalledOnce();
    });
  });
});
