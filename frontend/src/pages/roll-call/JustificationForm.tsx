import { useId, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';

type JustificationFormProps = {
  initialValue: string;
  onCancel: () => void;
  onConfirm: (justificativa: string) => void;
};

const MAX_LENGTH = 500;

export function JustificationForm({ initialValue, onCancel, onConfirm }: JustificationFormProps) {
  const id = useId();
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!value.trim()) {
      setError('Informe o motivo da falta justificada.');
      return;
    }
    onConfirm(value.trim());
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-2 animate-slide-down">
      <label htmlFor={id} className="text-sm font-medium text-brand-900">
        Justificativa
      </label>
      <textarea
        id={id}
        autoFocus
        rows={3}
        maxLength={MAX_LENGTH}
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setError(null);
        }}
        placeholder="Ex.: atestado médico"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="w-full resize-none rounded-xl border border-black/10 px-4 py-3 text-base text-ink placeholder:text-placeholder focus:border-brand-900 focus:shadow-[0_0_0_4px_rgb(0_0_119/0.12)] focus:outline-none"
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-danger animate-slide-down">
          {error}
        </p>
      )}
      <p className="text-xs text-muted">O aluno sai da mesa e a falta não zera a nota.</p>
      <div className="mt-1 flex gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" className="h-12 flex-1 text-base">
          Justificar falta
        </Button>
      </div>
    </form>
  );
}
