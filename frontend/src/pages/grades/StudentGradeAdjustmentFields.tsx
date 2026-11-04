import { formatGrade } from '@/utils/formatGrade';
import { cn } from '@/utils/cn';

type GradeInputsProps = {
  currentGrade: number;
  newGrade: string;
  onNewGradeChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
};

function CurrentGradeCard({ value }: { value: number }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-black/5 bg-gray-50/70 p-3.5 shadow-2xs">
      <label htmlFor="student-current-grade" className="text-xs font-medium text-muted">
        Nota do aluno
      </label>
      <input
        id="student-current-grade"
        type="text"
        readOnly
        aria-readonly="true"
        value={formatGrade(value)}
        className="w-full bg-transparent text-xl font-bold text-ink outline-none cursor-default"
      />
    </div>
  );
}

type NewGradeCardProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
};

function NewGradeCard({ value, onChange, error, disabled }: NewGradeCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col justify-between rounded-2xl border-2 p-3.5 shadow-2xs transition',
        error
          ? 'border-danger/70 bg-red-50/30 focus-within:ring-2 focus-within:ring-danger/20'
          : 'border-brand-500 bg-blue-50/40 focus-within:ring-2 focus-within:ring-brand-500/20',
      )}
    >
      <label htmlFor="new-grade-input" className="text-xs font-semibold text-brand-700">
        Nova nota
      </label>
      <input
        id="new-grade-input"
        aria-label="Nova nota"
        type="number"
        step="0.1"
        min="0"
        max="10"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0,0"
        className="w-full bg-transparent text-xl font-bold text-brand-700 outline-none placeholder:text-brand-300"
      />
    </div>
  );
}

export function GradeAdjustmentInputs({
  currentGrade,
  newGrade,
  onNewGradeChange,
  error,
  disabled,
}: GradeInputsProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-2 gap-3">
        <CurrentGradeCard value={currentGrade} />
        <NewGradeCard
          value={newGrade}
          onChange={onNewGradeChange}
          error={error}
          disabled={disabled}
        />
      </div>
      {error && (
        <p id="student-grade-error" className="text-sm text-danger animate-slide-down">
          {error}
        </p>
      )}
    </div>
  );
}

type JustificationFieldProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
};

export function GradeJustificationField({
  value,
  onChange,
  error,
  disabled,
}: JustificationFieldProps) {
  const length = value.length;
  const isTooShort = length > 0 && value.trim().length < 10;
  const hasError = Boolean(error || isTooShort);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="justification-input" className="text-sm font-semibold text-ink">
        Justificativa do ajuste <span className="text-danger">*</span>
      </label>
      <textarea
        id="justification-input"
        aria-label="Justificativa do ajuste"
        rows={3}
        maxLength={500}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Explique o que embasou a mudança de nota"
        className={cn(
          'w-full resize-none rounded-2xl border p-3.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2',
          hasError
            ? 'border-danger/70 focus:border-danger focus:ring-danger/20'
            : 'border-black/10 focus:border-brand-500 focus:ring-brand-500/20',
        )}
      />
      <div className="flex items-center justify-between text-xs text-muted">
        <span className={hasError ? 'text-danger' : ''}>
          {error || (isTooShort ? 'Mínimo de 10 caracteres' : '')}
        </span>
        <span aria-label="Contador de caracteres">{length} / 500</span>
      </div>
    </div>
  );
}

export type StudentGradeAdjustmentFieldsProps = {
  existingGrade: number;
  newGrade: string;
  onNewGradeChange: (value: string) => void;
  justification: string;
  onJustificationChange: (value: string) => void;
  gradeError?: string;
  justificationError?: string;
  disabled: boolean;
};

export function StudentGradeAdjustmentFields(props: StudentGradeAdjustmentFieldsProps) {
  return (
    <div className="flex flex-col gap-3">
      <GradeAdjustmentInputs
        currentGrade={props.existingGrade}
        newGrade={props.newGrade}
        onNewGradeChange={props.onNewGradeChange}
        error={props.gradeError}
        disabled={props.disabled}
      />
      <GradeJustificationField
        value={props.justification}
        onChange={props.onJustificationChange}
        error={props.justificationError}
        disabled={props.disabled}
      />
    </div>
  );
}
