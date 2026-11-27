import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Spinner } from '@/components/ui/Spinner';
import type { GeneralFeedbackResponse } from '@/types/feedback';
import { ProblemGeneralFeedbackForm } from './ProblemGeneralFeedbackForm';

export type ProblemGeneralFeedbackModalProps = {
  isOpen: boolean;
  onClose: () => void;
  existingFeedback: GeneralFeedbackResponse | null;
  isLoading?: boolean;
  loadError?: string | null;
  onRetryLoad?: () => void;
  roomId: string;
  problemId: string;
  onSaved: (feedback: GeneralFeedbackResponse) => void;
};

type ModalContentProps = Omit<ProblemGeneralFeedbackModalProps, 'isOpen'>;

function ModalContent({
  isLoading,
  loadError,
  onRetryLoad,
  existingFeedback,
  roomId,
  problemId,
  onSaved,
  onClose,
}: ModalContentProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner label="Carregando feedback geral" className="size-7 text-brand-accent" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col gap-3 py-2">
        <Alert tone="error">{loadError}</Alert>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} className="h-10 w-auto px-4">
            Fechar
          </Button>
          {onRetryLoad && (
            <Button
              type="button"
              variant="primary"
              onClick={onRetryLoad}
              className="h-10 w-auto px-4"
            >
              Tentar novamente
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <ProblemGeneralFeedbackForm
      key={existingFeedback?.id ?? 'new-problem-general-feedback'}
      existingFeedback={existingFeedback}
      roomId={roomId}
      problemId={problemId}
      onSaved={onSaved}
      onClose={onClose}
    />
  );
}

export function ProblemGeneralFeedbackModal({
  isOpen,
  onClose,
  ...rest
}: ProblemGeneralFeedbackModalProps) {
  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      placement="center"
      title="Feedback Geral da Turma"
      description="Consolidado de feedback para todos os alunos no problema"
    >
      {isOpen && <ModalContent {...rest} onClose={onClose} />}
    </Sheet>
  );
}
