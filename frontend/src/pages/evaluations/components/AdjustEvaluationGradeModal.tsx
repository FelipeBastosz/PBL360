import { useState, type FormEvent, type ReactNode } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import type {
  EvaluationAdjustmentSituation,
  EvaluationHistoryOrigin,
} from '@/types/evaluationHistory';
import { getInitials } from '@/utils/initials';
import { GradeInputs, JustificationField } from './AdjustEvaluationGradeFields';

export type AdjustStudentInfo = {
  alunoId: string;
  nome: string;
  matricula: string | null;
  notaAluno?: number | null;
  notaVigente?: number | null;
  notaAlunoOriginal?: number | null;
  notaPares?: number | null;
  avaliacoesPares?: number;
  situacaoAjuste?: EvaluationAdjustmentSituation;
  origem?: EvaluationHistoryOrigin | null;
};

export type AdjustEvaluationGradeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  student: AdjustStudentInfo | null;
  hideNames?: boolean;
  onSubmit: (payload: { novaNota: number; justificativa: string }) => Promise<void> | void;
  isLoading?: boolean;
  details?: ReactNode;
};

function parseGrade(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.');
  if (!normalized) return null;
  const num = Number(normalized);
  if (Number.isNaN(num) || num < 0 || num > 10) return null;
  return Math.round(num * 100) / 100;
}

function checkCanSubmit(
  parsedGrade: number | null,
  currentGrade: number,
  justification: string,
): boolean {
  const isGradeChanged = parsedGrade !== null && Math.abs(parsedGrade - currentGrade) >= 0.005;
  const isJustificationValid = justification.trim().length >= 10 && justification.length <= 500;
  return isGradeChanged && isJustificationValid;
}

type ModalHeaderProps = {
  student: AdjustStudentInfo;
  hideNames?: boolean;
  onClose: () => void;
  isLoading?: boolean;
};

function ModalHeader({ student, hideNames, onClose, isLoading }: ModalHeaderProps) {
  const displayName = hideNames ? student.matricula || 'Sem matrícula' : student.nome;
  const initials = getInitials(student.nome);

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white shadow-xs"
        >
          {initials}
        </div>
        <h2 id="adjust-grade-modal-title" className="truncate text-base font-bold text-ink">
          {displayName}
        </h2>
      </div>
      <button
        type="button"
        onClick={onClose}
        disabled={isLoading}
        aria-label="Fechar"
        className="shrink-0 rounded-lg bg-subtle p-1.5 text-muted transition hover:bg-subtle hover:text-ink active:scale-95 disabled:opacity-50"
      >
        <XMarkIcon className="size-5" />
      </button>
    </div>
  );
}

type FormProps = {
  student: AdjustStudentInfo;
  hideNames?: boolean;
  onClose: () => void;
  onSubmit: (payload: { novaNota: number; justificativa: string }) => Promise<void> | void;
  isLoading: boolean;
  details?: ReactNode;
};

function isPeerAssessmentUnderway(student: AdjustStudentInfo): boolean {
  return (
    student.notaAluno === null &&
    (student.notaPares === null || student.notaPares === undefined) &&
    student.situacaoAjuste !== 'AJUSTADA' &&
    (student.avaliacoesPares !== undefined || student.notaAlunoOriginal !== null)
  );
}

function currentGradeLabelOf(student: AdjustStudentInfo): string {
  if (student.origem === 'PLANNING_POKER') return 'Nota do planning poker';
  if (student.notaAluno === null && student.notaPares != null) return 'Nota dos pares';
  return 'Nota do aluno';
}

function FormSubmitButton({ disabled, isLoading }: { disabled: boolean; isLoading: boolean }) {
  return (
    <Button
      type="submit"
      disabled={disabled}
      isLoading={isLoading}
      className="mt-1 w-full rounded-2xl py-3.5 text-sm font-semibold"
    >
      Salvar ajuste
    </Button>
  );
}

function AdjustEvaluationGradeForm({
  student,
  hideNames,
  onClose,
  onSubmit,
  isLoading,
  details,
}: FormProps) {
  const currentGrade = student.notaVigente ?? student.notaAluno ?? student.notaPares ?? 0;
  const [newGrade, setNewGrade] = useState(String(currentGrade));
  const [justification, setJustification] = useState('');

  const parsedGrade = parseGrade(newGrade);
  const canSubmit = checkCanSubmit(parsedGrade, currentGrade, justification);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit || parsedGrade === null) return;
    onSubmit({ novaNota: parsedGrade, justificativa: justification.trim() });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative z-10 flex max-h-full w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-3xl bg-elevated p-6 shadow-2xl sm:rounded-3xl"
    >
      <ModalHeader
        student={student}
        hideNames={hideNames}
        onClose={onClose}
        isLoading={isLoading}
      />
      {isPeerAssessmentUnderway(student) && (
        <Alert tone="info">
          A avaliação por pares está em andamento. Inserir uma nota sobrescreverá a média dos pares.
        </Alert>
      )}
      {details}
      <GradeInputs
        currentGrade={currentGrade}
        currentGradeLabel={currentGradeLabelOf(student)}
        newGrade={newGrade}
        onNewGradeChange={setNewGrade}
        isLoading={isLoading}
      />
      <JustificationField value={justification} onChange={setJustification} isLoading={isLoading} />
      <FormSubmitButton disabled={!canSubmit || isLoading} isLoading={isLoading} />
    </form>
  );
}

export function AdjustEvaluationGradeModal({
  isOpen,
  onClose,
  student,
  hideNames = false,
  onSubmit,
  isLoading = false,
  details,
}: AdjustEvaluationGradeModalProps) {
  useEscapeKey(isOpen, onClose, isLoading);

  if (!isOpen || !student) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="adjust-grade-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-xs sm:items-center sm:p-4"
    >
      <div className="fixed inset-0" aria-hidden="true" onClick={isLoading ? undefined : onClose} />
      <AdjustEvaluationGradeForm
        key={`${student.alunoId}-${student.notaVigente ?? student.notaAluno ?? student.notaPares ?? 0}`}
        student={student}
        hideNames={hideNames}
        onClose={onClose}
        onSubmit={onSubmit}
        isLoading={isLoading}
        details={details}
      />
    </div>
  );
}
