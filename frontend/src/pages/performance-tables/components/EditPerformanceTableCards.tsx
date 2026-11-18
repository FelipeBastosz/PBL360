import { PencilIcon } from '@heroicons/react/24/outline';

export function DescriptionCard({
  description,
  canEditInfo = true,
  onOpenEdit,
}: {
  description: string;
  canEditInfo?: boolean;
  onOpenEdit: () => void;
}) {
  return (
    <div className="rounded-[14px] border border-black/5 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-brand-900">Descrição</h2>
        {canEditInfo && (
          <button
            type="button"
            onClick={onOpenEdit}
            aria-label="Editar descrição e título"
            className="relative text-brand-900 after:absolute after:-inset-3"
          >
            <PencilIcon className="size-5" />
          </button>
        )}
      </div>
      <p className="mt-1 text-sm text-muted">{description || 'Sem descrição'}</p>
    </div>
  );
}

export function EditActions({
  onSave,
  onCancel,
  onDeleteFormula,
  canDeleteFormula = true,
  disabled = false,
}: {
  onSave: () => void;
  onCancel: () => void;
  onDeleteFormula: () => void;
  canDeleteFormula?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="mt-8 flex flex-col gap-3">
      {canDeleteFormula && (
        <button
          type="button"
          onClick={onDeleteFormula}
          className="w-full rounded-[14px] bg-danger py-3.5 text-base font-bold text-white shadow-lg hover:bg-danger/90"
        >
          Excluir essa fórmula
        </button>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={onSave}
        className="w-full rounded-[14px] bg-brand-900 py-3.5 text-base font-bold text-white shadow-lg hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Concluir edição
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="relative text-center text-sm font-semibold text-brand-900 underline after:absolute after:inset-x-0 after:-inset-y-2"
      >
        Cancelar
      </button>
    </div>
  );
}
