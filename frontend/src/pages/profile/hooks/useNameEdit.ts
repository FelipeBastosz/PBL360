import { useState, useCallback } from 'react';

export function useNameEdit(initialName: string, onSaveName: (name: string) => Promise<boolean>) {
  const [isEditing, setIsEditing] = useState(false);
  const [nameValue, setNameValue] = useState(initialName);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const startEdit = useCallback(() => {
    setNameValue(initialName);
    setNameError(null);
    setIsEditing(true);
  }, [initialName]);

  const cancelEdit = useCallback(() => {
    setNameValue(initialName);
    setNameError(null);
    setIsEditing(false);
  }, [initialName]);

  const changeName = useCallback((value: string) => {
    setNameValue(value);
    setNameError(null);
  }, []);

  const save = useCallback(async () => {
    const trimmed = nameValue.trim();
    if (trimmed.length < 3 || trimmed.length > 120) {
      setNameError('O nome deve ter entre 3 e 120 caracteres.');
      return;
    }
    setIsSaving(true);
    setNameError(null);
    try {
      const ok = await onSaveName(trimmed);
      if (ok) setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }, [nameValue, onSaveName]);

  return { isEditing, nameValue, nameError, isSaving, startEdit, cancelEdit, changeName, save };
}
