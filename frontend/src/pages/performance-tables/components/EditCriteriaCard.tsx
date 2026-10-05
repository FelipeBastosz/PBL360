import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { CriterionInput } from '@/types/performanceTable';

function CriterionRow({ item, onEdit }: { item: CriterionInput; onEdit: () => void }) {
  return (
    <div className="border-b border-black/5 px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-brand-900">{item.nome}</span>
        <span className="inline-flex min-w-9 items-center justify-center rounded-full bg-gray-200 px-3 py-1 text-xs font-bold text-ink">
          {item.peso}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-xs text-muted">{item.descricao || 'Sem descrição'}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Editar critério ${item.nome}`}
            className="text-brand-900 hover:opacity-80"
          >
            <PencilIcon className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Excluir critério"
            disabled
            className="text-danger opacity-60"
          >
            <TrashIcon className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function EditCriteriaCard({
  items,
  onOpenAdd,
  onOpenEdit,
}: {
  items: CriterionInput[];
  onOpenAdd: () => void;
  onOpenEdit: (criterion: CriterionInput) => void;
}) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-black/5 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-black/5 px-4 py-3 text-sm font-semibold text-brand-900">
        <span>Critério</span>
        <span>Peso</span>
      </div>
      <div>
        {items.map((item, index) => (
          <CriterionRow
            key={item.id ?? `${item.nome}-${index}`}
            item={item}
            onEdit={() => onOpenEdit(item)}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={onOpenAdd}
        className="w-full px-4 py-3 text-left text-sm font-semibold text-brand-900 hover:bg-brand-50"
      >
        +Adicionar critério
      </button>
    </div>
  );
}
