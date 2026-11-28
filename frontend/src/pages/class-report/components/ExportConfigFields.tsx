import { cn } from '@/utils/cn';

export type StudentIdOption = 'NAME_AND_REGISTRATION' | 'REGISTRATION_ONLY';

type RadioOptionProps = {
  selected: boolean;
  label: string;
  onSelect: () => void;
};

function RadioOption({ selected, label, onSelect }: RadioOptionProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-colors',
        selected ? 'border-brand-accent bg-brand-soft/50' : 'border-border hover:bg-subtle',
      )}
    >
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-brand-accent">
        <span className={cn('size-2.5 rounded-full bg-brand-primary', !selected && 'opacity-0')} />
      </span>
      <span className="text-sm font-medium text-ink">{label}</span>
    </button>
  );
}

type StudentRadioProps = {
  value: StudentIdOption;
  onChange: (val: StudentIdOption) => void;
};

export function StudentIdentificationRadio({ value, onChange }: StudentRadioProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted">
        Identificação do Aluno
      </span>
      <div role="radiogroup" aria-label="Identificação do Aluno" className="flex flex-col gap-2">
        <RadioOption
          selected={value === 'NAME_AND_REGISTRATION'}
          label="Nome e Matrícula"
          onSelect={() => onChange('NAME_AND_REGISTRATION')}
        />
        <RadioOption
          selected={value === 'REGISTRATION_ONLY'}
          label="Apenas Matrícula"
          onSelect={() => onChange('REGISTRATION_ONLY')}
        />
      </div>
    </div>
  );
}
