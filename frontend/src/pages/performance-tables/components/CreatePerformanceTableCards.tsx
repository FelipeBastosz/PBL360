type TitleCardProps = {
  value: string;
  onChange: (v: string) => void;
  hasError: boolean;
};

export function TitleCard({ value, onChange, hasError }: TitleCardProps) {
  return (
    <div className="rounded-[14px] border border-border-subtle bg-elevated p-4 shadow-sm">
      <label htmlFor="title-input" className="text-sm font-semibold text-brand-accent">
        Título da Fórmula
      </label>
      <input
        id="title-input"
        type="text"
        placeholder="Fórmula Padrão"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-2 h-12 w-full rounded-[10px] border px-4 text-sm text-ink placeholder:text-placeholder focus:outline-none focus:ring-1 ${
          hasError
            ? 'border-danger focus:border-danger focus:ring-danger'
            : 'border-border focus:border-brand-accent focus:ring-brand-accent'
        }`}
      />
    </div>
  );
}

export function FormActions({
  onSave,
  onCancel,
  disabled = false,
}: {
  onSave: () => void;
  onCancel: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="mt-8 flex flex-col gap-3">
      <button
        type="button"
        disabled={disabled}
        onClick={onSave}
        className="w-full rounded-[14px] bg-brand-primary py-3.5 text-base font-bold text-white shadow-lg transition-transform hover:bg-brand-primary-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-brand-primary disabled:active:scale-100"
      >
        Salvar Fórmula
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="relative text-center text-sm font-semibold text-brand-accent underline after:absolute after:inset-x-0 after:-inset-y-2 hover:opacity-80"
      >
        Cancelar
      </button>
    </div>
  );
}
