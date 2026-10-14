import { formatGrade } from '@/utils/gradeFormatters';
import { cn } from '@/utils/cn';

type GradeInputsProps = {
  currentGrade: number;
  newGrade: string;
  onNewGradeChange: (value: string) => void;
  isLoading?: boolean;
};

export function GradeInputs({
  currentGrade,
  newGrade,
  onNewGradeChange,
  isLoading,
}: GradeInputsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col justify-between rounded-2xl border border-black/5 bg-gray-50/70 p-3.5 shadow-2xs">
        <label htmlFor="student-current-grade" className="text-xs font-medium text-muted">
          Nota do aluno
        </label>
        <input
          id="student-current-grade"
          type="text"
          readOnly
          aria-readonly="true"
          value={formatGrade(currentGrade)}
          className="w-full bg-transparent text-xl font-bold text-ink outline-none cursor-default"
        />
      </div>

      <div className="flex flex-col justify-between rounded-2xl border-2 border-brand-500 bg-blue-50/40 p-3.5 shadow-2xs transition focus-within:ring-2 focus-within:ring-brand-500/20">
        <label htmlFor="new-grade-input" className="text-xs font-semibold text-brand-700">
          Nova nota
        </label>
        <input
          id="new-grade-input"
          aria-label="Nova nota"
          type="number"
          step="0.01"
          min="0"
          max="10"
          value={newGrade}
          disabled={isLoading}
          onChange={(e) => onNewGradeChange(e.target.value)}
          placeholder="0,0"
          className="w-full bg-transparent text-xl font-bold text-brand-700 outline-none placeholder:text-brand-300"
        />
      </div>
    </div>
  );
}

type JustificationFieldProps = {
  value: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
};

export function JustificationField({ value, onChange, isLoading }: JustificationFieldProps) {
  const length = value.length;
  const isTooShort = length > 0 && value.trim().length < 10;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="justification-input" className="text-xs font-semibold text-ink">
        Justificativa do ajuste <span className="text-danger">*</span>
      </label>
      <textarea
        id="justification-input"
        aria-label="Justificativa do ajuste"
        rows={3}
        maxLength={500}
        value={value}
        disabled={isLoading}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Explique o que embasou a mudança de nota"
        className={cn(
          'w-full resize-none rounded-2xl border p-3.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2',
          isTooShort
            ? 'border-danger/70 focus:border-danger focus:ring-danger/20'
            : 'border-black/10 focus:border-brand-500 focus:ring-brand-500/20',
        )}
      />
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{isTooShort ? 'Mínimo de 10 caracteres' : ''}</span>
        <span aria-label="Contador de caracteres">{length} / 500</span>
      </div>
    </div>
  );
}
