import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { CriterionInput } from '@/types/performanceTable';

function CriterionRow({
  item,
  onEdit,
  onDelete,
  canDelete = true,
}: {
  item: CriterionInput;
  onEdit: () => void;
  onDelete: () => void;
  canDelete?: boolean;
}) {
  return (
    <div className="border-b border-border-subtle px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-brand-accent">{item.nome}</span>
        <span className="inline-flex min-w-9 items-center justify-center rounded-full bg-subtle px-3 py-1 text-xs font-bold text-ink">
          {item.peso}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-xs text-muted">{item.descricao || 'Sem descrição'}</span>
        <div className="-mr-2 flex items-center">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Editar critério ${item.nome}`}
            className="inline-flex size-11 items-center justify-center rounded-full transition-[background-color,scale] duration-200 active:scale-90 focus-visible:outline-2 text-brand-accent hover:bg-brand-soft focus-visible:outline-brand-accent"
          >
            <PencilIcon className="size-5" />
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              aria-label={`Excluir critério ${item.nome}`}
              className="inline-flex size-11 items-center justify-center rounded-full transition-[background-color,scale] duration-200 active:scale-90 focus-visible:outline-2 text-danger hover:bg-danger-soft focus-visible:outline-danger"
            >
              <TrashIcon className="size-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EditCriteriaCard({
  items,
  canEditCriteria = true,
  onOpenAdd,
  onOpenEdit,
  onOpenDelete,
}: {
  items: CriterionInput[];
  canEditCriteria?: boolean;
  onOpenAdd: () => void;
  onOpenEdit: (criterion: CriterionInput) => void;
  onOpenDelete: (criterion: CriterionInput) => void;
}) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-border-subtle bg-elevated shadow-sm">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3 text-sm font-semibold text-brand-accent">
        <span>Critério</span>
        <span>Peso</span>
      </div>
      <div>
        {items.map((item, index) => (
          <CriterionRow
            key={item.id ?? `${item.nome}-${index}`}
            item={item}
            onEdit={() => onOpenEdit(item)}
            onDelete={() => onOpenDelete(item)}
            canDelete={canEditCriteria}
          />
        ))}
      </div>
      {canEditCriteria && (
        <button
          type="button"
          onClick={onOpenAdd}
          className="w-full px-4 py-3 text-left text-sm font-semibold text-brand-accent hover:bg-brand-soft"
        >
          +Adicionar critério
        </button>
      )}
    </div>
  );
}
