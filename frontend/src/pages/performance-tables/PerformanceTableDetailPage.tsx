import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeftIcon,
  LockClosedIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { UserMenuButton } from '@/components/layout/UserMenu';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { performanceTableService } from '@/services/performance-table.service';
import type { CriterionInput, PerformanceTable } from '@/types/performanceTable';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';
import { ApplyScopeModal, IgnoredSessionsModal } from './components/ApplyScopeModal';
import { useApplyTableLogic } from './hooks/useApplyTableLogic';
import { reconcileSessionCriteria } from './utils/reconcileSessionCriteria';

function DetailHeader({ title }: { title: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="shrink-0 border-b border-brand-primary-border bg-brand-primary text-white">
      <div className={cn(PAGE_CONTAINER_CLASS, 'flex h-16 items-center justify-between')}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Voltar"
            className="-ml-1 rounded-full p-2 transition-transform hover:bg-white/10 active:scale-90"
          >
            <ChevronLeftIcon className="size-6" strokeWidth={2} />
          </button>
          <h1 className="text-lg font-bold">{title}</h1>
        </div>
        <UserMenuButton user={user} />
      </div>
    </header>
  );
}

function CriteriaListCard({ criteria }: { criteria: CriterionInput[] }) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-border-subtle bg-elevated shadow-sm">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3 text-sm font-semibold text-brand-accent">
        <span>Critério</span>
        <span>Peso</span>
      </div>
      <div>
        {criteria.map((item, idx) => (
          <div
            key={item.id ?? `${item.nome}-${idx}`}
            className="border-b border-border-subtle px-4 py-3 last:border-b-0"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-brand-accent">{item.nome}</span>
              <span className="inline-flex min-w-9 items-center justify-center rounded-full bg-subtle px-3 py-1 text-xs font-bold text-ink">
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

type BannersProps = {
  isApplied: boolean;
  isLocked: boolean;
  isShared: boolean;
  authorName?: string;
};

function DetailBanners({ isApplied, isLocked, isShared, authorName }: BannersProps) {
  return (
    <>
      {isShared && (
        <aside
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 rounded-xl border border-brand-border bg-brand-soft p-3 text-xs font-medium text-brand-accent"
        >
          <InformationCircleIcon className="size-4 shrink-0 text-brand-accent" aria-hidden="true" />
          <span>
            Fórmula compartilhada da turma{authorName ? ` · Criada por ${authorName}` : ''}.
          </span>
        </aside>
      )}
      {isApplied && (
        <div className="flex items-center justify-between rounded-xl border border-success/30 bg-success-soft p-3 text-xs font-semibold text-success">
          Esta fórmula já está aplicada a esta sessão.
        </div>
      )}
      {isLocked && (
        <div className="flex items-start gap-2 rounded-xl border border-warning-line bg-warning-soft p-3 text-xs text-warning">
          <LockClosedIcon className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
          <span>Esta sessão já possui avaliações enviadas e a tabela não pode ser alterada.</span>
        </div>
      )}
    </>
  );
}

function DetailActionButtons({ apply }: { apply: ReturnType<typeof useApplyTableLogic> }) {
  if (!apply.canApply) return null;
  if (apply.isAlreadyApplied) {
    return (
      <div className="mt-8">
        <button
          type="button"
          onClick={apply.editAppliedTable}
          className="w-full rounded-[14px] bg-brand-primary py-3.5 text-base font-bold text-white shadow-lg transition-transform hover:bg-brand-primary-hover"
        >
          Editar fórmula
        </button>
      </div>
    );
  }
  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={apply.openModal}
        disabled={apply.isApplying || apply.isSessionLocked}
        className="w-full rounded-[14px] bg-brand-primary py-3.5 text-base font-bold text-white shadow-lg transition-transform hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        Aplicar fórmula
      </button>
    </div>
  );
}

type DetailContentProps = {
  table: PerformanceTable;
  apply: ReturnType<typeof useApplyTableLogic>;
  currentUserId?: string;
};

function checkIsShared(table: PerformanceTable, currentUserId?: string): boolean {
  if (!currentUserId || !table.professorId) return false;
  const isDefault = Boolean(table.isDefault ?? table.padrao ?? table.origem === 'PADRAO');
  return table.professorId !== currentUserId && !isDefault;
}

function DetailModals({ apply }: { apply: ReturnType<typeof useApplyTableLogic> }) {
  return (
    <>
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

function DetailContent({ table, apply, currentUserId }: DetailContentProps) {
  const isShared = checkIsShared(table, currentUserId);
  const displayedCriteria = reconcileSessionCriteria(table.criterios, apply.sessionCriteria);

  return (
    <>
      <DetailBanners
        isApplied={apply.isAlreadyApplied}
        isLocked={apply.isSessionLocked}
        isShared={isShared}
        authorName={table.autor?.nome}
      />
      {table.descricao && (
        <div className="rounded-[14px] border border-border-subtle bg-elevated p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-brand-accent">Descrição</h2>
          <p className="mt-1 text-sm text-muted">{table.descricao}</p>
        </div>
      )}
      <CriteriaListCard criteria={displayedCriteria} />
      <DetailActionButtons apply={apply} />
      <DetailModals apply={apply} />
    </>
  );
}

export function PerformanceTableDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [table, setTable] = useState<PerformanceTable | null>(null);
  const { run, isLoading, error } = useAsyncAction(
    useCallback(() => performanceTableService.getById(id!), [id]),
  );
  const apply = useApplyTableLogic(table);

  useEffect(() => {
    run().then((result) => result.ok && setTable(result.data));
  }, [run]);

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <DetailHeader title={table?.nome || 'Detalhes da fórmula'} />
      <main className={cn(PAGE_CONTAINER_CLASS, 'mt-4 flex flex-col gap-4')}>
        {isLoading && (
          <div className="mt-12 flex justify-center">
            <Spinner className="size-8 text-brand-accent" />
          </div>
        )}
        {error && <Alert tone="error">{error.message}</Alert>}
        {table && <DetailContent table={table} apply={apply} currentUserId={user?.id} />}
      </main>
    </div>
  );
}

export default PerformanceTableDetailPage;
