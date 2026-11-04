import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import type { TableSessionUsage } from '@/types/session';

type Props = {
  isOpen: boolean;
  isLoading: boolean;
  sessions: TableSessionUsage[];
  onConfirm: (scope: 'SESSAO' | 'TODAS') => void;
  onCancel: () => void;
};

function ScopeRadioGroup({
  scope,
  onChange,
  count,
}: {
  scope: 'SESSAO' | 'TODAS';
  onChange: (s: 'SESSAO' | 'TODAS') => void;
  count: number;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-surface p-3 text-left text-xs">
      <span className="font-semibold text-ink">Escopo das alterações:</span>
      <label className="flex cursor-pointer items-center gap-2 text-ink">
        <input
          type="radio"
          name="edit-scope"
          value="SESSAO"
          checked={scope === 'SESSAO'}
          onChange={() => onChange('SESSAO')}
          className="accent-brand-900"
        />
        Aplicar só nesta sessão
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-ink">
        <input
          type="radio"
          name="edit-scope"
          value="TODAS"
          checked={scope === 'TODAS'}
          onChange={() => onChange('TODAS')}
          className="accent-brand-900"
        />
        Em todas as {count} {count === 1 ? 'sessão' : 'sessões'} que usam esta tabela
      </label>
    </div>
  );
}

function SessionList({ sessions }: { sessions: TableSessionUsage[] }) {
  if (sessions.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 text-left">
      <span className="text-[11px] font-semibold text-muted uppercase">Sessões vinculadas:</span>
      <ul className="flex max-h-28 flex-col gap-1 overflow-y-auto rounded-lg border border-black/5 bg-surface/50 p-2 text-xs">
        {sessions.map((s) => (
          <li key={s.sessaoId} className="flex items-center justify-between text-ink">
            <span className="font-medium">{s.rotulo}</span>
            {s.jaAconteceu && (
              <span className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] text-muted">
                já aconteceu
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EditScopeModal({ isOpen, isLoading, sessions, onConfirm, onCancel }: Props) {
  const [scope, setScope] = useState<'SESSAO' | 'TODAS'>('SESSAO');

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-scope-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
    >
      <div className="relative flex w-full max-w-sm flex-col gap-4 rounded-[24px] bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={isLoading ? undefined : onCancel}
          disabled={isLoading}
          aria-label="Fechar"
          className="absolute right-4 top-4 rounded-full p-1 text-ink/60 hover:text-ink"
        >
          <XMarkIcon className="size-6" />
        </button>

        <h2 id="edit-scope-title" className="text-left text-lg font-bold text-brand-900">
          Onde aplicar as alterações?
        </h2>

        <ScopeRadioGroup scope={scope} onChange={setScope} count={sessions.length} />
        <SessionList sessions={sessions} />

        <div className="mt-2 flex flex-col gap-2">
          <Button
            type="button"
            isLoading={isLoading}
            onClick={() => onConfirm(scope)}
            className="bg-brand-900 hover:bg-brand-800 text-white border-transparent"
          >
            Confirmar e salvar
          </Button>
          <Button
            type="button"
            variant="link"
            disabled={isLoading}
            onClick={onCancel}
            className="text-muted hover:text-ink"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
