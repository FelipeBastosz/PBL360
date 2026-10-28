import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { formatPokerGrade, parsePokerGrade, roundToTenths } from '@/utils/pokerFormat';
import { TextLink } from './PokerCard';
import { PokerModal } from './PokerModal';

type AdjustGradeModalProps = {
  studentName: string;
  average: number | null;
  isBusy: boolean;
  onSave: (grade: number, justification: string) => void;
  onClose: () => void;
};

const STEP = 0.1;
const STEPPER =
  'size-10 rounded-xl border border-black/10 bg-white text-lg font-bold disabled:opacity-30';

function GradeStepper({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const [raw, setRaw] = useState<string | null>(null);
  const shift = (delta: number) =>
    onChange(roundToTenths(Math.min(10, Math.max(0, value + delta))));
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Diminuir nota"
        onClick={() => shift(-STEP)}
        className={cn(STEPPER, 'text-ink')}
      >
        −
      </button>
      <input
        type="text"
        inputMode="decimal"
        aria-label="Nova nota"
        value={raw ?? formatPokerGrade(value)}
        onChange={(event) => setRaw(event.target.value)}
        onBlur={() => {
          const parsed = parsePokerGrade(raw ?? '');
          if (parsed !== null) onChange(parsed);
          setRaw(null);
        }}
        className="w-[60px] rounded-lg border border-black/10 bg-white py-1.5 text-center text-base font-bold text-ink"
      />
      <button
        type="button"
        aria-label="Aumentar nota"
        onClick={() => shift(STEP)}
        className={cn(STEPPER, 'text-brand-900')}
      >
        +
      </button>
    </div>
  );
}

type JustificationFieldProps = {
  value: string;
  hasError: boolean;
  onChange: (value: string) => void;
};

function JustificationField({ value, hasError, onChange }: JustificationFieldProps) {
  const length = value.trim().length;
  return (
    <>
      <label className="flex flex-col gap-1.5">
        <span className="flex justify-between text-[13px] font-semibold text-ink">
          Justificativa do ajuste *
          {length < 10 && <span className="font-medium text-placeholder">{length}/10</span>}
        </span>
        <textarea
          rows={3}
          value={value}
          maxLength={500}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Motivo do ajuste da nota..."
          className={cn(
            'w-full resize-y rounded-xl border p-3 text-[13px] text-ink placeholder:text-placeholder focus:outline-none focus:ring-1',
            hasError
              ? 'border-danger'
              : 'border-black/10 focus:border-brand-900 focus:ring-brand-900',
          )}
        />
      </label>
      {hasError && <span className="text-xs text-danger">Mínimo de 10 caracteres.</span>}
    </>
  );
}

type GradeFieldsProps = {
  average: number | null;
  grade: number;
  onGrade: (grade: number) => void;
};

function GradeFields({ average, grade, onGrade }: GradeFieldsProps) {
  return (
    <>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-ink">Média dos votos</span>
        <input
          type="text"
          readOnly
          aria-readonly="true"
          value={formatPokerGrade(average)}
          className="h-12 rounded-xl border border-black/10 bg-black/5 px-4 text-base text-placeholder"
        />
      </label>
      <div className="flex items-center justify-between gap-2 py-1.5">
        <div className="flex flex-col">
          <span className="text-[13px] font-semibold text-ink">Nova nota</span>
          <span className="text-xs text-muted">De 0 a 10, até duas casas</span>
        </div>
        <GradeStepper value={grade} onChange={onGrade} />
      </div>
    </>
  );
}

export function AdjustGradeModal({
  studentName,
  average,
  isBusy,
  onSave,
  onClose,
}: AdjustGradeModalProps) {
  const [grade, setGrade] = useState(roundToTenths(average ?? 0));
  const [justification, setJustification] = useState('');
  const [hasError, setHasError] = useState(false);
  function save() {
    if (justification.trim().length < 10) {
      setHasError(true);
      return;
    }
    onSave(grade, justification.trim());
  }

  return (
    <PokerModal isOpen label="Reajustar nota" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <h2 className="pr-8 text-base font-bold text-brand-900">Reajustar nota</h2>
        <p className="text-xs leading-relaxed text-muted">
          {studentName}. A nota ajustada substitui a média para este aluno e fica marcada como
          reajustada.
        </p>
        <GradeFields average={average} grade={grade} onGrade={setGrade} />
        <JustificationField
          value={justification}
          hasError={hasError}
          onChange={(value) => {
            setJustification(value);
            setHasError(false);
          }}
        />
        <div className="mt-2 flex flex-col gap-2">
          <Button onClick={save} isLoading={isBusy}>
            Salvar nota ajustada
          </Button>
          <TextLink onClick={onClose}>Cancelar</TextLink>
        </div>
      </div>
    </PokerModal>
  );
}
