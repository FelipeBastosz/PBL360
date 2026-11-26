import { Link, useParams } from 'react-router-dom';
import {
  ClipboardDocumentCheckIcon,
  StarIcon,
  AdjustmentsHorizontalIcon,
  ClockIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline';
import type { ComponentType, ReactNode } from 'react';

type ActionCardProps = {
  to: string;
  state?: unknown;
  title: string;
  desc: string;
  color: string;
  Icon: ComponentType<{ className?: string }>;
  disabled?: boolean;
  badge?: string;
};

function ActionCardContent({
  title,
  desc,
  color,
  Icon,
}: Pick<ActionCardProps, 'title' | 'desc' | 'color' | 'Icon'>) {
  return (
    <>
      <div className={`flex size-11 items-center justify-center rounded-xl ${color}`}>
        <Icon className="size-6" />
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-bold break-words text-ink">{title}</h3>
        <p className="mt-1 text-xs text-muted leading-relaxed">{desc}</p>
      </div>
    </>
  );
}

function ActionCard({ to, state, title, desc, color, Icon, disabled, badge }: ActionCardProps) {
  if (disabled) {
    return (
      <div className="relative flex flex-col gap-3 rounded-2xl border border-border-subtle bg-elevated/70 p-4 shadow-sm opacity-60 cursor-not-allowed">
        {badge && (
          <span className="absolute right-3 top-3 rounded-full bg-subtle px-2 py-0.5 text-[10px] font-bold text-muted">
            {badge}
          </span>
        )}
        <ActionCardContent title={title} desc={desc} color={color} Icon={Icon} />
      </div>
    );
  }

  return (
    <Link
      to={to}
      state={state}
      className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-elevated p-4 shadow-sm transition hover:shadow-md"
    >
      <ActionCardContent title={title} desc={desc} color={color} Icon={Icon} />
    </Link>
  );
}

function PrimaryActions({
  basePath,
  isStudentEvalActive,
  isPokerActive,
}: {
  basePath: string;
  isStudentEvalActive: boolean;
  isPokerActive?: boolean;
}) {
  const isBlocked = isStudentEvalActive || Boolean(isPokerActive);
  const evalDesc = isPokerActive
    ? 'Planning poker em andamento na mesa.'
    : isStudentEvalActive
      ? 'Avaliações ativas. Consulte e ajuste no Histórico de avaliações.'
      : 'Critérios, marcações e feedback';
  const evalColor = isBlocked ? 'bg-subtle text-placeholder' : 'bg-success-soft text-success';

  return (
    <>
      <ActionCard
        to={`${basePath}/chamada`}
        title="Chamada"
        desc="Mesa tutorial, papéis e horário"
        color="bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300"
        Icon={ClipboardDocumentCheckIcon}
      />
      <ActionCard
        to={`${basePath}/avaliar`}
        title="Avaliar alunos"
        desc={evalDesc}
        color={evalColor}
        Icon={StarIcon}
        disabled={isBlocked}
        badge={isBlocked ? 'Bloqueado' : undefined}
      />
    </>
  );
}

export function SessionActionGrid({
  basePath,
  isStudentEvalActive,
  isPokerActive,
  children,
}: {
  basePath: string;
  isStudentEvalActive: boolean;
  isPokerActive?: boolean;
  children?: ReactNode;
}) {
  const {
    roomId = '',
    problemId = '',
    sessionId = '',
  } = useParams<{ roomId: string; problemId: string; sessionId: string }>();

  return (
    <div className="grid grid-cols-2 gap-3 lg:row-span-2 [&>*]:min-w-0">
      <PrimaryActions
        basePath={basePath}
        isStudentEvalActive={isStudentEvalActive}
        isPokerActive={isPokerActive}
      />
      <ActionCard
        to={`${basePath}/formulas`}
        state={{ roomId, problemId, sessionId }}
        title="Fórmulas"
        desc="Critérios e nota final"
        color="bg-warning-soft text-warning"
        Icon={AdjustmentsHorizontalIcon}
      />
      <ActionCard
        to={`${basePath}/historico`}
        title="Histórico de avaliações"
        desc="Comparar e ajustar com justificativa"
        color="bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300"
        Icon={ClockIcon}
      />
      <ActionCard
        to={`${basePath}/relatorio`}
        title="Relatório da Sessão"
        desc="Visualize notas finais e exporte dados"
        color="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"
        Icon={DocumentChartBarIcon}
      />
      {children}
    </div>
  );
}
