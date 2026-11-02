import { useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

type Props = {
  isOpen: boolean;
  isLoading: boolean;
  isSessionLocked: boolean;
  onConfirm: (aplicarNasSeguintes: boolean) => void;
  onClose: () => void;
};

function LockedSessionWarning() {
  return (
    <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left text-xs text-amber-900">
      <ExclamationTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-600" />
      <span>
        <strong>Atenção:</strong> esta sessão já possui avaliações enviadas. Alterar esta fórmula
        recalculará automaticamente as notas finais de todos os alunos afetados.
      </span>
    </div>
  );
}

function ScopeRadioGroup({
  applyToFollowing,
  onToggle,
}: {
  applyToFollowing: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <div className="mt-4 flex flex-col gap-2 rounded-xl bg-surface p-3 text-xs">
      <span className="font-semibold text-ink">Escopo da alteração:</span>
      <label className="flex cursor-pointer items-center gap-2 text-ink">
        <input
          type="radio"
          name="scopeFormula"
          checked={!applyToFollowing}
          onChange={() => onToggle(false)}
          className="accent-brand-900"
        />
        Aplicar só nesta sessão
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-ink">
        <input
          type="radio"
          name="scopeFormula"
          checked={applyToFollowing}
          onChange={() => onToggle(true)}
          className="accent-brand-900"
        />
        Nesta e nas seguintes
      </label>
    </div>
  );
}

export function SaveFormulaScopeModal({
  isOpen,
  isLoading,
  isSessionLocked,
  onConfirm,
  onClose,
}: Props) {
  const [applyToFollowing, setApplyToFollowing] = useState(false);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-sm rounded-[24px] bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={isLoading ? undefined : onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-ink/60 hover:bg-black/5"
        >
          <XMarkIcon className="size-6" />
        </button>
        <h2 className="text-lg font-bold text-brand-900">Salvar fórmula da nota</h2>

        {isSessionLocked && <LockedSessionWarning />}
        <ScopeRadioGroup applyToFollowing={applyToFollowing} onToggle={setApplyToFollowing} />

        <div className="mt-4 flex flex-col gap-2">
          <Button isLoading={isLoading} onClick={() => onConfirm(applyToFollowing)}>
            Confirmar e salvar
          </Button>
          <Button variant="link" disabled={isLoading} onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
