type TitleCardProps = {
  value: string;
  onChange: (v: string) => void;
  hasError: boolean;
};

export function TitleCard({ value, onChange, hasError }: TitleCardProps) {
  return (
    <div className="rounded-[14px] border border-black/5 bg-white p-4 shadow-sm">
      <label htmlFor="title-input" className="text-sm font-semibold text-brand-900">
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
            : 'border-black/10 focus:border-brand-900 focus:ring-brand-900'
        }`}
      />
    </div>
  );
}

export function FormActions({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  return (
    <div className="mt-8 flex flex-col gap-3">
      <button
        type="button"
        onClick={onSave}
        className="w-full rounded-[14px] bg-brand-900 py-3.5 text-base font-bold text-white shadow-lg transition-transform hover:bg-brand-800 active:scale-[0.98]"
      >
        Salvar Fórmula
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="text-center text-sm font-semibold text-brand-900 underline hover:opacity-80"
      >
        Cancelar
      </button>
    </div>
  );
}
