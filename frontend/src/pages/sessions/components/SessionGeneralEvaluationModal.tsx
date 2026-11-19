import { Sheet } from '@/components/ui/Sheet';
import type { SessionGeneralEvaluation } from '@/types/session';
import { SessionGeneralEvaluationForm } from './SessionGeneralEvaluationForm';

export type SessionGeneralEvaluationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  existingEvaluation: SessionGeneralEvaluation | null;
  onSaved: (saved: SessionGeneralEvaluation) => void;
};

export function SessionGeneralEvaluationModal({
  isOpen,
  onClose,
  sessionId,
  existingEvaluation,
  onSaved,
}: SessionGeneralEvaluationModalProps) {
  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      placement="center"
      title="Avaliação Geral da Sessão"
      description="Consolidado de feedback para todos os alunos na sessão"
    >
      {isOpen && (
        <SessionGeneralEvaluationForm
          key={existingEvaluation?.id ?? 'new-session-evaluation'}
          sessionId={sessionId}
          existingEvaluation={existingEvaluation}
          onSaved={onSaved}
          onClose={onClose}
        />
      )}
    </Sheet>
  );
}
