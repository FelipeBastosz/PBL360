import type { ReceivedFeedbackResponse } from '@/types/feedback';
import { FeedbackCard } from './FeedbackCard';

export function GeneralFeedbackSection({ feedback }: { feedback: ReceivedFeedbackResponse }) {
  return (
    <section aria-label="Feedback da Turma" className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-brand-900 uppercase tracking-wider">
        Geral da Turma
      </h2>
      <FeedbackCard
        autor={feedback.autor}
        texto={feedback.texto}
        criadoEm={feedback.criadoEm}
        editadoEm={feedback.editadoEm}
        novo={feedback.novo}
      />
    </section>
  );
}
