import { Sheet } from '@/components/ui/Sheet';
import type { GeneralFeedbackResponse } from '@/types/feedback';
import { GeneralFeedbackForm } from './GeneralFeedbackForm';

export type GeneralFeedbackModalProps = {
  isOpen: boolean;
  onClose: () => void;
  existingFeedback: GeneralFeedbackResponse | null;
  roomId: string;
  problemId: string;
  onSaved: (feedback: GeneralFeedbackResponse) => void;
  updatedAt?: string | null;
};

export function GeneralFeedbackModal({
  isOpen,
  onClose,
  existingFeedback,
  roomId,
  problemId,
  onSaved,
  updatedAt,
}: GeneralFeedbackModalProps) {
  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      placement="center"
      title="Feedback Geral da Turma"
      description="Consolidado de feedback para todos os alunos no problema"
    >
      {isOpen && (
        <GeneralFeedbackForm
          key={existingFeedback?.id ?? 'new-general'}
          existingFeedback={existingFeedback}
          roomId={roomId}
          problemId={problemId}
          onSaved={onSaved}
          onClose={onClose}
          updatedAt={updatedAt}
        />
      )}
    </Sheet>
  );
}
