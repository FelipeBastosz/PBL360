import type { MyPerformanceSession } from '@/utils/myPerformance';
import { MODALITY_LABELS } from '@/utils/studentPerformance';

// Students see the grade origin and the tutor feedback; behaviour marks stay with the tutor.
export function MySessionDetails({ session }: { session: MyPerformanceSession }) {
  return (
    <dl className="grid gap-2">
      <div className="flex flex-col gap-1 rounded-xl bg-surface p-2.5">
        <dt className="text-[11px] font-semibold text-muted">Avaliação</dt>
        <dd className="text-sm font-semibold text-ink">
          {session.modalidade ? MODALITY_LABELS[session.modalidade] : 'Tutor'}
        </dd>
      </div>
      <div className="flex flex-col gap-1 rounded-xl bg-surface p-2.5">
        <dt className="text-[11px] font-semibold text-muted">Feedback do tutor</dt>
        {session.feedback ? (
          <dd className="flex flex-col gap-1">
            <p className="text-sm whitespace-pre-line text-ink">{session.feedback}</p>
            {session.feedbackAuthor && (
              <p className="text-xs text-muted">{session.feedbackAuthor}</p>
            )}
          </dd>
        ) : (
          <dd className="text-sm text-muted">Ainda não enviado</dd>
        )}
      </div>
    </dl>
  );
}
