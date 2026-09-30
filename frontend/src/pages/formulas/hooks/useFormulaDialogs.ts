import { useState } from 'react';
import type { SnackbarTone } from '../components/FormulaSnackbar';

export type ModalState = {
  isOpen: boolean;
  type:
    'DELETE_FORMULA' | 'DELETE_CRITERION' | 'UNSAVED_CHANGES' | 'VALIDATION_ERROR' | 'BLOCK' | null;
  title?: string;
  message: string;
  primaryActionLabel: string;
  isDestructive?: boolean;
  onConfirm?: () => void;
};

export function useFormulaDialogs() {
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: null,
    message: '',
    primaryActionLabel: '',
  });

  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
    tone: SnackbarTone;
  }>({
    isOpen: false,
    message: '',
    tone: 'success',
  });

  const showSnackbar = (message: string, tone: SnackbarTone = 'success') => {
    setSnackbar({ isOpen: true, message, tone });
  };

  const closeModal = () => setModal((prev) => ({ ...prev, isOpen: false }));

  return { modal, setModal, snackbar, setSnackbar, showSnackbar, closeModal };
}
