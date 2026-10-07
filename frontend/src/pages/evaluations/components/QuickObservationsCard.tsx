import { useState } from 'react';
import { CheckIcon, ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';

const DEFAULT_TAGS = [
  { id: '1', label: 'Celular fora de contexto', Icon: XMarkIcon },
  { id: '2', label: 'Atraso', Icon: ClockIcon },
  { id: '3', label: 'Não participação', Icon: XMarkIcon },
  { id: '4', label: 'Contribuição relevante', Icon: CheckIcon },
];

function TagButtons({
  selectedTags,
  onToggle,
}: {
  selectedTags: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {DEFAULT_TAGS.map(({ id, label, Icon }) => {
        const isSelected = selectedTags.includes(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => onToggle(id)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
              isSelected
                ? 'border-brand-900 bg-brand-50 text-brand-900'
                : 'border-black/10 bg-white text-ink hover:bg-gray-50'
            }`}
          >
            <Icon className="size-3.5 stroke-[2.5]" />
            <span>{label}</span>
          </button>
        );
      })}
      <button
        type="button"
        disabled
        className="rounded-xl border border-dashed border-brand-900/40 bg-brand-50/50 px-3 py-2 text-xs font-semibold text-brand-900 opacity-60"
      >
        + criar marcação
      </button>
    </div>
  );
}

export function QuickObservationsCard({
  complement,
  onComplementChange,
}: {
  complement: string;
  onComplementChange: (val: string) => void;
}) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  function toggleTag(id: string) {
    setSelectedTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-brand-900">Observações rápidas</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Toque para marcar. As marcações entram no histórico do aluno.
      </p>
      <TagButtons selectedTags={selectedTags} onToggle={toggleTag} />
      <input
        type="text"
        placeholder="Observação complementar (texto livre)"
        value={complement}
        onChange={(e) => onComplementChange(e.target.value)}
        className="mt-4 h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-xs text-ink placeholder:text-placeholder focus:border-brand-900 focus:outline-none focus:ring-1 focus:ring-brand-900"
      />
    </div>
  );
}
