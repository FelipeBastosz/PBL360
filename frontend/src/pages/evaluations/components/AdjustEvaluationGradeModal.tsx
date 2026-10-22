import { useState, useEffect, type FormEvent } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { getInitials } from '@/utils/initials';
import { GradeInputs, JustificationField } from './AdjustEvaluationGradeFields';

export type AdjustStudentInfo = {
  alunoId: string;
  nome: string;
  matricula: string | null;
  notaAluno?: number | null;
  notaVigente?: number | null;
  notaAlunoOriginal?: number | null;
};

export type AdjustEvaluationGradeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  student: AdjustStudentInfo | null;
  hideNames?: boolean;
  onSubmit: (payload: { novaNota: number; justificativa: string }) => Promise<void> | void;
  isLoading?: boolean;
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

function useEscapeKey(isOpen: boolean, onClose: () => void, disabled = false) {
  useEffect(() => {
    if (!isOpen || disabled) return undefined;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose, disabled]);
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
        className="shrink-0 rounded-lg bg-gray-100 p-1.5 text-gray-500 transition hover:bg-gray-200 hover:text-ink active:scale-95 disabled:opacity-50"
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
};

function AdjustEvaluationGradeForm({
  student,
  hideNames,
  onClose,
  onSubmit,
  isLoading,
}: FormProps) {
  const currentGrade = student.notaVigente ?? student.notaAluno ?? 0;
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
      className="relative z-10 flex max-h-full w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
    >
      <ModalHeader
        student={student}
        hideNames={hideNames}
        onClose={onClose}
        isLoading={isLoading}
      />
      <GradeInputs
        currentGrade={currentGrade}
        newGrade={newGrade}
        onNewGradeChange={setNewGrade}
        isLoading={isLoading}
      />
      <JustificationField value={justification} onChange={setJustification} isLoading={isLoading} />
      <Button
        type="submit"
        disabled={!canSubmit || isLoading}
        isLoading={isLoading}
        className="mt-1 w-full rounded-2xl py-3.5 text-sm font-semibold"
      >
        Salvar ajuste
      </Button>
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
        key={`${student.alunoId}-${student.notaVigente ?? student.notaAluno ?? 0}`}
        student={student}
        hideNames={hideNames}
        onClose={onClose}
        onSubmit={onSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
