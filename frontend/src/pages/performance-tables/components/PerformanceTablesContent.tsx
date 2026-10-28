import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import type { PerformanceTableSummary } from '@/types/performanceTable';
import type { SessionEvaluationConfig } from '@/types/session';
import type { ApplyTarget } from '@/utils/navigationState';
import { PerformanceTableSection } from './PerformanceTableSection';

type SectionsData = {
  padrao: PerformanceTableSummary[];
  turma: PerformanceTableSummary[];
  minhas: PerformanceTableSummary[];
};

type Props = {
  isLoading: boolean;
  error: Error | null;
  hasTargetSession: boolean;
  sessionConfig: SessionEvaluationConfig | null;
  filtered: PerformanceTableSummary[];
  sections: SectionsData | null;
  currentUserId?: string;
  target: ApplyTarget | null;
  checkApplied: (table: PerformanceTableSummary) => boolean;
  onDeleteTable: (table: PerformanceTableSummary) => void;
};

function ActiveSessionFormulaBanner({ config }: { config: SessionEvaluationConfig | null }) {
  if (!config?.tabela) return null;
  return (
    <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900 shadow-xs">
      <div className="flex items-center gap-2">
        <CheckCircleIcon className="size-5 shrink-0 text-emerald-600" />
        <span>
          Fórmula em uso nesta sessão: <strong>{config.tabela.nome}</strong>
        </span>
      </div>
      <span className="shrink-0 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
        Aplicada
      </span>
    </div>
  );
}

function SectionsRenderer(props: Props) {
  if (!props.sections) return null;
  return (
    <>
      <PerformanceTableSection
        title="Padrão do sistema"
        tables={props.sections.padrao}
        currentUserId={props.currentUserId}
        target={props.target}
        checkIsApplied={props.checkApplied}
        onOpenDelete={props.onDeleteTable}
      />
      <PerformanceTableSection
        title="Da turma"
        tables={props.sections.turma}
        currentUserId={props.currentUserId}
        target={props.target}
        checkIsApplied={props.checkApplied}
        onOpenDelete={props.onDeleteTable}
      />
      <PerformanceTableSection
        title="Minhas"
        tables={props.sections.minhas.map((t) => ({ ...t, emUso: undefined }))}
        currentUserId={props.currentUserId}
        target={props.target}
        checkIsApplied={props.checkApplied}
        onOpenDelete={props.onDeleteTable}
      />
    </>
  );
}

export function PerformanceTablesContent(props: Props) {
  return (
    <main className={`${PAGE_CONTAINER_CLASS} mt-4`}>
      {props.hasTargetSession && <ActiveSessionFormulaBanner config={props.sessionConfig} />}
      {props.error && <Alert tone="error">{props.error.message}</Alert>}
      {props.isLoading && (
        <div className="mt-10 flex justify-center">
          <Spinner className="size-8 text-brand-900" />
        </div>
      )}
      {!props.isLoading && props.filtered.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted">Nenhuma fórmula encontrada.</p>
      )}
      <SectionsRenderer {...props} />
    </main>
  );
}
