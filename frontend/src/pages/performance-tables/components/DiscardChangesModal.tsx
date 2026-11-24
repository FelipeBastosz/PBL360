type Props = {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DiscardChangesModal({ isOpen, onConfirm, onCancel }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative flex max-h-full w-full max-w-sm overflow-y-auto flex-col gap-4 rounded-[22px] bg-elevated p-6 text-center shadow-2xl">
        <h2 className="text-lg font-bold text-brand-accent">Descartar alterações?</h2>
        <p className="text-sm text-muted">
          As alterações feitas nesta fórmula não foram salvas e serão perdidas se você sair agora.
        </p>

        <div className="mt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full rounded-[14px] bg-danger-solid py-3 text-sm font-bold text-white shadow-md hover:bg-danger-solid/90"
          >
            Sair sem salvar
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-[14px] border border-border py-3 text-sm font-semibold text-brand-accent hover:bg-subtle"
          >
            Continuar editando
          </button>
        </div>
      </div>
    </div>
  );
}
