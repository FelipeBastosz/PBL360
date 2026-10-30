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
          className="h-11 w-auto rounded-xl border-brand-900 px-4 text-sm font-semibold text-brand-900"
        >
          <XMarkIcon className="size-4" aria-hidden />
          Cancelar
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={onSave}
          disabled={isSaving}
          className="h-11 w-auto rounded-xl px-5 text-sm font-semibold shadow-[0_10px_24px_-8px_rgb(0_0_119/0.55)]"
        >
          <CheckIcon className="size-4" aria-hidden />
          Salvar
        </Button>
      </div>
    </div>
  );
}
