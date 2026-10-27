import type { BehaviorTag } from '@/types/observation';

type Props = {
  tags: BehaviorTag[];
  counts: Record<string, number>;
  onIncrement: (tagId: string) => void;
  onDecrement: (tagId: string) => void;
  onNavigateMoreTags: () => void;
};

function ActiveTagRow({
  tag,
  count,
  onIncrement,
  onDecrement,
}: {
  tag: BehaviorTag;
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-900/15 bg-brand-50/60 p-3 shadow-xs">
      <span className="min-w-32 flex-1 text-xs font-semibold break-words text-brand-900">
        {tag.nome}
      </span>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <button
          type="button"
          aria-label={`Diminuir marcação ${tag.nome}`}
          onClick={onDecrement}
          className="flex size-6 items-center justify-center rounded-lg border border-brand-900/20 bg-white text-xs font-bold text-brand-900 hover:bg-brand-100 active:scale-95"
        >
          −
        </button>
        <span className="flex size-5 items-center justify-center rounded-full bg-brand-900 text-[11px] font-bold text-white">
          {count}
        </span>
        <button
          type="button"
          aria-label={`Aumentar marcação ${tag.nome}`}
          onClick={onIncrement}
          className="flex size-6 items-center justify-center rounded-lg border border-brand-900/20 bg-white text-xs font-bold text-brand-900 hover:bg-brand-100 active:scale-95"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function QuickObservationsCard({
  tags,
  counts,
  onIncrement,
  onDecrement,
  onNavigateMoreTags,
}: Props) {
  const activeTags = tags.filter((t) => (counts[t.id] ?? 0) > 0);

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-brand-900">Observações rápidas</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Marcações registradas para o aluno nesta sessão.
      </p>

      <div className="mt-4 flex flex-col gap-2.5">
        {activeTags.length === 0 ? (
          <p className="py-2 text-center text-xs text-muted">Nenhuma marcação atribuída ainda.</p>
        ) : (
          activeTags.map((tag) => (
            <ActiveTagRow
              key={tag.id}
              tag={tag}
              count={counts[tag.id] ?? 0}
              onIncrement={() => onIncrement(tag.id)}
              onDecrement={() => onDecrement(tag.id)}
            />
          ))
        )}
      </div>

      <button
        type="button"
        onClick={onNavigateMoreTags}
        className="mt-4 block w-full rounded-xl border border-brand-900 bg-white py-2.5 text-center text-xs font-bold text-brand-900 transition hover:bg-brand-50"
      >
        Ver outras marcações
      </button>
    </div>
  );
}
