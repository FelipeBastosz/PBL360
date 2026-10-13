import { fieldControlClassName } from '@/components/ui/fieldStyles';

type StudentGradeFieldProps = {
  value: string;
  onChange: (val: string) => void;
  error?: string;
  disabled: boolean;
};

export function StudentGradeField({ value, onChange, error, disabled }: StudentGradeFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="student-grade-input" className="text-sm font-semibold text-ink">
        Nota <span className="text-danger">*</span>
      </label>
      <input
        id="student-grade-input"
        type="number"
        step="0.1"
        min="0"
        max="10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0,0 a 10,0"
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'student-grade-error' : undefined}
        className={fieldControlClassName(Boolean(error))}
      />
      {error && (
        <p id="student-grade-error" className="text-sm text-danger animate-slide-down">
          {error}
        </p>
      )}
    </div>
  );
}
