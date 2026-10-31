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
        <label className="text-lg text-brand-900">Nome completo</label>
        {!isEditing && (
          <button
            type="button"
            onClick={startEdit}
            aria-label="Editar nome completo"
            title="Editar nome completo"
            className="flex items-center gap-1.5 p-1 text-ink/70 transition-colors hover:text-brand-900 focus-visible:outline-2 focus-visible:outline-brand-900"
          >
            <PencilIcon className="size-5" aria-hidden />
            <span className="text-sm font-semibold text-brand-900">Editar</span>
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
        <p className="flex h-12 w-full items-center rounded-xl border border-black/10 bg-white px-4 text-base text-ink shadow-[0_1px_2px_rgb(16_33_76/0.06)]">
          {initialName}
        </p>
      )}
    </div>
  );
}
