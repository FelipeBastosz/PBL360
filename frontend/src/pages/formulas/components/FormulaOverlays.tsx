import { FormulaModal } from './FormulaModal';
import { FormulaSnackbar } from './FormulaSnackbar';
import type { useFormulaDialogs } from '../hooks/useFormulaDialogs';

type Props = {
  dialogs: ReturnType<typeof useFormulaDialogs>;
  isLoading: boolean;
};

export function FormulaOverlays({ dialogs, isLoading }: Props) {
  const { modal, snackbar, setSnackbar, closeModal } = dialogs;

  return (
    <>
      <FormulaModal
        isOpen={modal.isOpen}
        message={modal.message}
        title={modal.title}
        primaryActionLabel={modal.primaryActionLabel}
        isDestructive={modal.isDestructive}
        onPrimaryAction={modal.onConfirm || closeModal}
        onClose={closeModal}
        isLoading={isLoading}
      />
      {snackbar.isOpen && (
        <FormulaSnackbar
          message={snackbar.message}
          tone={snackbar.tone}
          onDismiss={() => setSnackbar((prev) => ({ ...prev, isOpen: false }))}
        />
      )}
    </>
  );
}
