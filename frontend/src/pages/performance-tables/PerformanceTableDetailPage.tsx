import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeftIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/routes/paths';
import { performanceTableService } from '@/services/performance-table.service';
import { sessionService } from '@/services/session.service';
import type { PerformanceTable } from '@/types/performanceTable';
import type { SessionTableIgnored, SessionEvaluationConfig } from '@/types/session';
import { readApplyTarget } from '@/utils/navigationState';
import { ApplyScopeModal, IgnoredSessionsModal } from './components/ApplyScopeModal';

function DetailHeader({ title }: { title: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="flex h-16 shrink-0 items-center justify-between bg-brand-900 px-4 text-white">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Voltar" className="p-1">
          <ChevronLeftIcon className="size-6" strokeWidth={2} />
        </button>
        <h1 className="text-lg font-bold">{title}</h1>
      </div>
      <UserAvatar user={user} />
    </header>
  );
}

function CriteriaListCard({ criteria }: { criteria: PerformanceTable['criterios'] }) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-black/5 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-black/5 px-4 py-3 text-sm font-semibold text-brand-900">
        <span>Critério</span>
        <span>Peso</span>
      </div>
      <div>
        {criteria.map((item) => (
          <div key={item.id} className="border-b border-black/5 px-4 py-3 last:border-b-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-brand-900">{item.nome}</span>
              <span className="inline-flex min-w-9 items-center justify-center rounded-full bg-gray-200 px-3 py-1 text-xs font-bold text-ink">
                {item.peso}
              </span>
            </div>
            {item.descricao && <p className="mt-1 text-xs text-muted">{item.descricao}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function isAlreadyApplied(
  table: PerformanceTable,
  sessionId?: string,
  config?: SessionEvaluationConfig | null,
): boolean {
  try {
    if (sessionId) {
      const appliedId = sessionStorage.getItem(`pbl360_applied_table_${sessionId}`);
      if (appliedId) return appliedId === table.id;
    }
  } catch {
    // ignore
  }
  if (!config?.tabela) return false;
  if (config.tabela.id === table.id) return true;
  const configName = (config.tabela.nome ?? '').trim().toLowerCase();
  const tableName = (table.nome ?? '').trim().toLowerCase();
  return configName !== '' && configName === tableName;
}

function useApplyNavigation(target: ReturnType<typeof readApplyTarget>) {
  const navigate = useNavigate();
  const goToHub = useCallback(() => {
    if (!target?.sessionId) return;
    navigate(
      ROUTES.sessionHub
        .replace(':roomId', target.roomId ?? '')
        .replace(':problemId', target.problemId ?? '')
        .replace(':sessionId', target.sessionId),
      { replace: true },
    );
  }, [navigate, target]);
  return { goToHub };
}

function useApplyTable(table: PerformanceTable | null) {
  const target = readApplyTarget(useLocation().state);
  const { notify } = useToast();
  const { goToHub } = useApplyNavigation(target);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ignoredList, setIgnoredList] = useState<SessionTableIgnored[]>([]);
  const [sessionConfig, setSessionConfig] = useState<SessionEvaluationConfig | null>(null);
  const { run, isLoading, error } = useAsyncAction(sessionService.applyTable);

  useEffect(() => {
    if (!target?.sessionId || typeof sessionService.getEvaluationConfig !== 'function') return;
    sessionService
      .getEvaluationConfig(target.sessionId)
      .then(setSessionConfig)
      .catch(() => undefined);
  }, [target?.sessionId]);

  const handleApply = async (aplicarNasSeguintes: boolean) => {
    if (!target || !table) return;
    const res = await run(target.sessionId, { tabelaId: table.id, aplicarNasSeguintes });
    if (!res.ok) return;

    // Atualiza a memória permanente com a nova tabela aplicada
    try {
      sessionStorage.setItem(`pbl360_applied_table_${target.sessionId}`, table.id);
    } catch {
      // ignore
    }

    setIsModalOpen(false);
    notify({ tone: 'success', message: 'Fórmula aplicada com sucesso.' });
    if (res.data?.sessoesIgnoradas?.length > 0) setIgnoredList(res.data.sessoesIgnoradas);
    else goToHub();
  };

  return {
    canApply: target !== null,
    isAlreadyApplied: table ? isAlreadyApplied(table, target?.sessionId, sessionConfig) : false,
    isSessionLocked: sessionConfig?.bloqueada ?? false,
    currentTableName: sessionConfig?.tabela?.nome ?? null,
    isModalOpen,
    openModal: () => setIsModalOpen(true),
    closeModal: () => setIsModalOpen(false),
    handleApply,
    isApplying: isLoading,
    applyError: error,
    ignoredList,
    closeIgnored: goToHub,
  };
}

function DetailBanners({ isApplied, isLocked }: { isApplied: boolean; isLocked: boolean }) {
  return (
    <>
      {isApplied && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
          Esta fórmula já está aplicada a esta sessão.
        </div>
      )}
      {isLocked && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <LockClosedIcon className="size-4 shrink-0 mt-0.5 text-amber-600" />
          <span>Esta sessão já possui avaliações enviadas e a tabela não pode ser alterada.</span>
        </div>
      )}
    </>
  );
}

function DetailBody({
  table,
  apply,
}: {
  table: PerformanceTable;
  apply: ReturnType<typeof useApplyTable>;
}) {
  return (
    <>
      <DetailBanners isApplied={apply.isAlreadyApplied} isLocked={apply.isSessionLocked} />
      {table.descricao && (
        <div className="rounded-[14px] border border-black/5 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-brand-900">Descrição</h2>
          <p className="mt-1 text-sm text-muted">{table.descricao}</p>
        </div>
      )}
      <CriteriaListCard criteria={table.criterios} />
      {apply.canApply && !apply.isAlreadyApplied && (
        <div className="mt-8">
          <button
            type="button"
            onClick={apply.openModal}
            disabled={apply.isApplying || apply.isSessionLocked}
            className="w-full rounded-[14px] bg-brand-900 py-3.5 text-base font-bold text-white shadow-lg transition-transform hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Aplicar fórmula
          </button>
        </div>
      )}
      <ApplyScopeModal
        isOpen={apply.isModalOpen}
        isLoading={apply.isApplying}
        currentTableName={apply.currentTableName}
        errorMessage={apply.applyError?.message}
        onConfirm={apply.handleApply}
        onClose={apply.closeModal}
      />
      <IgnoredSessionsModal
        isOpen={apply.ignoredList.length > 0}
        ignored={apply.ignoredList}
        onClose={apply.closeIgnored}
      />
    </>
  );
}

export default function PerformanceTableDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [table, setTable] = useState<PerformanceTable | null>(null);
  const { run, isLoading, error } = useAsyncAction(
    useCallback(() => performanceTableService.getById(id!), [id]),
  );
  const apply = useApplyTable(table);

  useEffect(() => {
    run().then((result) => result.ok && setTable(result.data));
  }, [run]);

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <DetailHeader title={table?.nome || 'Detalhes da fórmula'} />
      <main className="mx-auto mt-4 flex w-full max-w-md flex-col gap-4 px-4">
        {isLoading && (
          <div className="mt-12 flex justify-center">
            <Spinner className="size-8 text-brand-900" />
          </div>
        )}
        {error && <Alert tone="error">{error.message}</Alert>}
        {table && <DetailBody table={table} apply={apply} />}
      </main>
    </div>
  );
}
