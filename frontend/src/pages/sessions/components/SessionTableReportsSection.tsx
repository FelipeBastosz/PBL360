import { Link } from 'react-router-dom';
import { ArrowRightIcon, CalendarIcon } from '@heroicons/react/24/outline';
import type { ProblemTableReport } from '@/types/session';
import { formatDayShortMonth } from '@/utils/date';
import { SessionAttachmentRow } from '../SessionAttachmentRow';
import type { SessionTableReportsGroup } from '../useProblemTableReports';

type SessionTableReportsSectionProps = {
  group: SessionTableReportsGroup;
  sessionPath: string;
  onDownload: (report: ProblemTableReport) => void;
};

const noopDelete = async () => undefined;

function SectionBody({
  group,
  onDownload,
}: Pick<SessionTableReportsSectionProps, 'group' | 'onDownload'>) {
  if (group.reports.length === 0) {
    return (
      <p className="py-2 text-center text-sm text-muted">
        Nenhum relatório de mesa anexado nesta sessão.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {group.reports.map((report) => (
        <SessionAttachmentRow
          key={report.id}
          attachment={report}
          canDelete={false}
          onDownload={() => onDownload(report)}
          onDelete={noopDelete}
        />
      ))}
    </ul>
  );
}

export function SessionTableReportsSection({
  group,
  sessionPath,
  onDownload,
}: SessionTableReportsSectionProps) {
  const { session } = group;

  return (
    <section
      aria-labelledby={`table-reports-session-${session.id}`}
      className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-elevated p-4 shadow-[0_1px_2px_rgb(0_0_0/0.08)]"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-accent">
            <CalendarIcon className="size-5" aria-hidden />
          </div>
          <h2
            id={`table-reports-session-${session.id}`}
            className="min-w-0 truncate text-base font-bold text-ink"
          >
            {session.titulo} · {formatDayShortMonth(session.data)}
          </h2>
        </div>
        <Link
          to={sessionPath}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-brand-accent transition-colors hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-brand-accent"
        >
          Abrir sessão
          <ArrowRightIcon className="size-4" aria-hidden />
        </Link>
      </header>
      <SectionBody group={group} onDownload={onDownload} />
    </section>
  );
}
