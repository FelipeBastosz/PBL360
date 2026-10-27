import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';

interface NameEditFormProps {
  nameValue: string;
  nameError: string | null;
  isSaving: boolean;
  onChangeName: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

export function NameEditForm({
  nameValue,
  nameError,
  isSaving,
  onChangeName,
  onCancel,
  onSave,
}: NameEditFormProps) {
  return (
    <div className="flex flex-col gap-2">
      <TextField
        label="Editar nome completo"
        value={nameValue}
        onChange={onChangeName}
        placeholder="Seu nome completo"
        error={nameError ?? undefined}
        disabled={isSaving}
        autoFocus
      />
      <div className="flex items-center justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
          className="h-10 w-auto px-3 text-xs"
        >
          <XMarkIcon className="size-4" aria-hidden />
          Cancelar
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={onSave}
          disabled={isSaving}
          className="h-10 w-auto px-4 text-xs"
        >
          <CheckIcon className="size-4" aria-hidden />
          Salvar
        </Button>
      </div>
    </div>
  );
}
