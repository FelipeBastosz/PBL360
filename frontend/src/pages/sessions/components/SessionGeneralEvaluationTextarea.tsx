import { cn } from '@/utils/cn';

type Props = {
  value: string;
  onChange: (val: string) => void;
  error: string | null;
  disabled: boolean;
};

export function SessionGeneralEvaluationTextarea({ value, onChange, error, disabled }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor="session-general-evaluation-text" className="text-sm font-semibold text-ink">
          Comentário Geral <span className="text-danger">*</span>
        </label>
        <span className="text-xs text-muted">{value.length} / 2000</span>
      </div>
      <textarea
        id="session-general-evaluation-text"
        rows={5}
        value={value}
        maxLength={2000}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Digite o parecer e considerações gerais sobre a turma nesta sessão..."
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'session-general-evaluation-error' : undefined}
        className={cn(
          'w-full rounded-xl border p-3 text-base text-ink bg-white shadow-[0_1px_2px_rgb(16_33_76/0.06)] transition-[border-color,box-shadow] duration-200 focus:outline-none placeholder:text-placeholder focus:border-brand-900 focus:shadow-[0_0_0_4px_rgb(0_0_119/0.12)] disabled:bg-black/5 disabled:cursor-not-allowed',
          error ? 'border-danger' : 'border-black/10',
        )}
      />
      {error && (
        <p id="session-general-evaluation-error" className="text-sm text-danger animate-slide-down">
          {error}
        </p>
      )}
    </div>
  );
}
