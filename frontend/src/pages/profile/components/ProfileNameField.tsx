import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { useNameEdit } from '../hooks/useNameEdit';
import { NameEditForm } from './NameEditForm';

interface ProfileNameFieldProps {
  initialName: string;
  onSaveName: (name: string) => Promise<boolean>;
}

export function ProfileNameField({ initialName, onSaveName }: ProfileNameFieldProps) {
  const { isEditing, nameValue, nameError, isSaving, startEdit, cancelEdit, changeName, save } =
    useNameEdit(initialName, onSaveName);

  return (
    <div>
      <div className="flex items-center justify-between pb-1">
        <label className="text-sm font-semibold text-ink">Nome completo</label>
        {!isEditing && (
          <Button
            type="button"
            variant="link"
            onClick={startEdit}
            className="h-8 gap-1 px-2 text-xs font-semibold text-brand-900"
          >
            <PencilSquareIcon className="size-4" aria-hidden />
            Editar
          </Button>
        )}
      </div>

      {isEditing ? (
        <NameEditForm
          nameValue={nameValue}
          nameError={nameError}
          isSaving={isSaving}
          onChangeName={changeName}
          onCancel={cancelEdit}
          onSave={save}
        />
      ) : (
        <p className="rounded-xl border border-line/60 bg-surface px-3 py-2.5 text-base text-ink">
          {initialName}
        </p>
      )}
    </div>
  );
}
