import { cn } from '@/utils/cn';

type StudentCommentFieldProps = {
  value: string;
  onChange: (val: string) => void;
  error?: string;
  disabled: boolean;
};

export function StudentCommentField({
  value,
  onChange,
  error,
  disabled,
}: StudentCommentFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="student-feedback-text" className="text-sm font-semibold text-ink">
        Comentário de Feedback <span className="text-danger">*</span>
      </label>
      <textarea
        id="student-feedback-text"
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Digite o feedback detalhado do aluno..."
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'student-feedback-error' : undefined}
        className={cn(
          'w-full rounded-xl border p-3 text-base text-ink bg-white shadow-[0_1px_2px_rgb(16_33_76/0.06)] transition-[border-color,box-shadow] duration-200 focus:outline-none placeholder:text-placeholder focus:border-brand-900 focus:shadow-[0_0_0_4px_rgb(0_0_119/0.12)] disabled:bg-black/5 disabled:cursor-not-allowed',
          error ? 'border-danger' : 'border-black/10',
        )}
      />
      {error && (
        <p id="student-feedback-error" className="text-sm text-danger animate-slide-down">
          {error}
        </p>
      )}
    </div>
  );
}
