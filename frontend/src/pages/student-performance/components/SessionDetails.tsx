import type { ReactNode } from 'react';
import { STATUS_LABEL, STATUS_TEXT_CLASS } from '@/pages/roll-call/attendanceLabels';
import type {
  PerformanceTimelineSession,
  StudentPerformanceSession,
} from '@/types/studentPerformance';
import { cn } from '@/utils/cn';
import { formatGrade } from '@/utils/formatGrade';
import {
  MODALITY_LABELS,
  type SituationTone,
  situationLabel,
  situationTone,
} from '@/utils/studentPerformance';

const TONE_CLASS: Record<SituationTone, string> = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-brand-50 text-brand-900',
};

type SessionProps = { session: StudentPerformanceSession };

type GradeDisplayProps = {
  session: PerformanceTimelineSession;
  // Why there is no grade yet, in the words of the view (situation, awaiting release...).
  pendingNote: string;
};

// Values come straight from the API; nothing is recalculated here.
export function GradeDisplay({ session, pendingNote }: GradeDisplayProps) {
  if (session.nota === null) {
    return (
      <div className="shrink-0 rounded-xl border border-dashed border-warning-line bg-warning-soft px-3 py-2 text-center text-warning">
        <p className="text-sm font-bold">Sem nota</p>
        <p className="text-[11px]">{pendingNote}</p>
      </div>
    );
  }
  return (
    <p className="flex shrink-0 items-baseline gap-0.5">
      <span className="text-5xl leading-none font-bold text-ink">{formatGrade(session.nota)}</span>
      <span className="text-sm text-muted">/10</span>
    </p>
  );
}

export function GradeBar({ session }: { session: PerformanceTimelineSession }) {
  const isPending = session.nota === null;
  const label = isPending ? 'Sem nota registrada' : `Nota ${formatGrade(session.nota)} de 10`;
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        'relative h-2.5 overflow-hidden rounded-full',
        isPending
          ? 'bg-[repeating-linear-gradient(135deg,var(--color-warning-soft)_0_6px,#fde7c8_6px_12px)]'
          : 'bg-black/5',
      )}
    >
      {!isPending && (
        <span
          style={{ width: `${(session.nota ?? 0) * 10}%` }}
          className="absolute inset-y-0 left-0 rounded-full bg-brand-900 transition-[width] duration-300"
        />
      )}
    </div>
  );
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl bg-surface p-2.5">
      <dt className="text-[11px] font-semibold text-muted">{label}</dt>
      <dd className="min-w-0 text-sm font-semibold text-ink">{children}</dd>
    </div>
  );
}

export function SessionStats({ session }: SessionProps) {
  return (
    <dl className="grid grid-cols-3 gap-2">
      <Stat label="Situação">
        <span
          className={cn(
            'inline-flex h-6 items-center rounded-full px-2 text-xs font-semibold',
            TONE_CLASS[situationTone(session.situacao)],
          )}
        >
          {situationLabel(session.situacao)}
        </span>
      </Stat>
      <Stat label="Modalidade">{MODALITY_LABELS[session.modalidade] ?? session.modalidade}</Stat>
      <Stat label="Presença">
        {session.presenca ? (
          <span className={cn('font-bold', STATUS_TEXT_CLASS[session.presenca])}>
            {STATUS_LABEL[session.presenca]}
          </span>
        ) : (
          <span className="text-muted">Não registrada</span>
        )}
      </Stat>
    </dl>
  );
}

export function SessionMarks({ session }: SessionProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="text-[11px] font-semibold text-muted">Marcações</h3>
      {session.marcacoes.length === 0 ? (
        <p className="text-sm text-muted">Sem marcações nesta sessão</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {session.marcacoes.map((mark) => (
            <li
              key={mark.id}
              className="inline-flex h-7 items-center gap-1 rounded-full bg-black/5 px-2.5 text-xs font-semibold text-ink"
            >
              {mark.nome}
              {mark.quantidade > 1 && <span className="text-muted">×{mark.quantidade}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Tutors see everything the API returns about the session, marks included.
export function TutorSessionDetails({ session }: SessionProps) {
  return (
    <>
      <SessionStats session={session} />
      <SessionMarks session={session} />
    </>
  );
}
