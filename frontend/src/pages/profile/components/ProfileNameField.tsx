import { PencilIcon } from '@heroicons/react/24/outline';
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
      <div className="flex items-center justify-between pb-1.5">
        <label className="text-lg text-brand-accent">Nome completo</label>
        {!isEditing && (
          <button
            type="button"
            onClick={startEdit}
            aria-label="Editar nome completo"
            title="Editar nome completo"
            className="flex items-center gap-1.5 p-1 text-ink/70 transition-colors hover:text-brand-accent focus-visible:outline-2 focus-visible:outline-brand-accent"
          >
            <PencilIcon className="size-5" aria-hidden />
            <span className="text-sm font-semibold text-brand-accent">Editar</span>
          </button>
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
        <p className="flex h-12 w-full items-center rounded-xl border border-border bg-elevated px-4 text-base text-ink shadow-[0_1px_2px_rgb(0_0_0/0.08)]">
          {initialName}
        </p>
      )}
    </div>
  );
}
