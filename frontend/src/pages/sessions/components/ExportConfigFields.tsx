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
  disabled?: boolean;
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

type ToggleRowProps = {
  id: string;
  label: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
};

export function ExportToggleRow({ id, label, checked, onToggle, disabled }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <label htmlFor={id} className="cursor-pointer text-sm font-medium text-ink">
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={onToggle}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-brand-accent disabled:cursor-not-allowed disabled:opacity-40',
          checked ? 'bg-brand-primary' : 'bg-border',
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block size-5 rounded-full bg-white shadow-md transform transition duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
    </div>
  );
}

type ExportSectionsConfigProps = {
  feedbacks: boolean;
  marcacoes: boolean;
  onToggleFeedbacks: () => void;
  onToggleMarcacoes: () => void;
  disabled?: boolean;
};

export function ExportSectionsConfig({
  feedbacks,
  marcacoes,
  onToggleFeedbacks,
  onToggleMarcacoes,
  disabled,
}: ExportSectionsConfigProps) {
  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted">
        Conteúdo do Relatório
      </span>
      <ExportToggleRow
        id="export-feedbacks-toggle"
        label="Feedbacks individuais"
        checked={feedbacks}
        onToggle={onToggleFeedbacks}
        disabled={disabled}
      />
      <ExportToggleRow
        id="export-marcacoes-toggle"
        label="Marcações da sessão"
        checked={marcacoes}
        onToggle={onToggleMarcacoes}
        disabled={disabled}
      />
    </div>
  );
}
