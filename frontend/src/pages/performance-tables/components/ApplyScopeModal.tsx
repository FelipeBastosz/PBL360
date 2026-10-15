import { useState } from 'react';
import {
  XMarkIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import type { SessionTableIgnored } from '@/types/session';

type ScopeModalProps = {
  isOpen: boolean;
  isLoading: boolean;
  currentTableName?: string | null;
  errorMessage?: string | null;
  onConfirm: (aplicarNasSeguintes: boolean) => void;
  onClose: () => void;
};

function ScopeSelector({
  applyToFollowing,
  onChange,
}: {
  applyToFollowing: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="mt-4 flex flex-col gap-2 rounded-xl bg-surface p-3 text-xs">
      <span className="font-semibold text-ink">Escopo da alteração:</span>
      <label className="flex cursor-pointer items-center gap-2 text-ink">
        <input
          type="radio"
          name="scope"
          checked={!applyToFollowing}
          onChange={() => onChange(false)}
          className="accent-brand-900"
        />
        Aplicar só nesta sessão
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-ink">
        <input
          type="radio"
          name="scope"
          checked={applyToFollowing}
          onChange={() => onChange(true)}
          className="accent-brand-900"
        />
        Nesta e nas seguintes
      </label>
    </div>
  );
}

export function ApplyScopeModal({
  isOpen,
  isLoading,
  currentTableName,
  errorMessage,
  onConfirm,
  onClose,
}: ScopeModalProps) {
  const [applyToFollowing, setApplyToFollowing] = useState(false);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-sm rounded-[24px] bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={isLoading ? undefined : onClose}
          disabled={isLoading}
          className="absolute right-4 top-4 rounded-full p-1 text-ink/60 hover:bg-black/5"
        >
          <XMarkIcon className="size-6" />
        </button>
        <h2 className="text-lg font-bold text-brand-900">Substituir tabela</h2>
        {currentTableName && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left text-xs text-amber-900">
            <ExclamationTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <span>
              Esta sessão já possui a tabela <strong>{currentTableName}</strong> vinculada. Deseja
              substituí-la por esta?
            </span>
          </div>
        )}
        {errorMessage && (
          <div className="mt-3">
            <Alert tone="error">{errorMessage}</Alert>
          </div>
        )}
        <ScopeSelector applyToFollowing={applyToFollowing} onChange={setApplyToFollowing} />
        <div className="mt-4 flex flex-col gap-2">
          <Button isLoading={isLoading} onClick={() => onConfirm(applyToFollowing)}>
            Confirmar substituição
          </Button>
          <Button variant="link" disabled={isLoading} onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}

export function IgnoredSessionsModal({
  isOpen,
  ignored,
  onClose,
}: {
  isOpen: boolean;
  ignored: SessionTableIgnored[];
  onClose: () => void;
}) {
  if (!isOpen || ignored.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-sm rounded-[24px] bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-2 text-amber-600">
          <ExclamationCircleIcon className="size-6 shrink-0" />
          <h2 className="text-base font-bold text-ink">Aviso sobre sessões seguintes</h2>
        </div>
        <p className="mt-2 text-xs text-muted">
          A fórmula foi aplicada, mas algumas sessões foram ignoradas:
        </p>
        <ul className="mt-3 flex max-h-40 flex-col gap-2 overflow-y-auto rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs">
          {ignored.map((item) => (
            <li key={item.sessaoId} className="flex flex-col text-ink">
              <span className="font-semibold">{item.rotulo}</span>
              <span className="text-[11px] text-muted">{item.motivo}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-end">
          <Button onClick={onClose}>Entendido</Button>
        </div>
      </div>
    </div>
  );
}
