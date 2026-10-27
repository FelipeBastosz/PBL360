import { Link, useParams } from 'react-router-dom';
import {
  ClipboardDocumentCheckIcon,
  StarIcon,
  AdjustmentsHorizontalIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import type { ComponentType, ReactNode } from 'react';
import { ROUTES } from '@/routes/paths';

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
      <div className="relative flex flex-col gap-3 rounded-2xl border border-black/5 bg-white/70 p-4 shadow-sm opacity-60 cursor-not-allowed">
        {badge && (
          <span className="absolute right-3 top-3 rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-bold text-muted">
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
      className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <ActionCardContent title={title} desc={desc} color={color} Icon={Icon} />
    </Link>
  );
}

function PrimaryActions({
  basePath,
  isStudentEvalActive,
}: {
  basePath: string;
  isStudentEvalActive: boolean;
}) {
  const evalDesc = isStudentEvalActive
    ? 'Avaliações ativas. Consulte e ajuste no Histórico de avaliações.'
    : 'Critérios, marcações e feedback';
  const evalColor = isStudentEvalActive
    ? 'bg-gray-100 text-gray-400'
    : 'bg-emerald-50 text-emerald-600';

  return (
    <>
      <ActionCard
        to={`${basePath}/chamada`}
        title="Chamada"
        desc="Mesa tutorial, papéis e horário"
        color="bg-blue-50 text-blue-600"
        Icon={ClipboardDocumentCheckIcon}
      />
      <ActionCard
        to={`${basePath}/avaliar`}
        title="Avaliar alunos"
        desc={evalDesc}
        color={evalColor}
        Icon={StarIcon}
        disabled={isStudentEvalActive}
        badge={isStudentEvalActive ? 'Bloqueado' : undefined}
      />
    </>
  );
}

export function SessionActionGrid({
  basePath,
  isStudentEvalActive,
  children,
}: {
  basePath: string;
  isStudentEvalActive: boolean;
  children?: ReactNode;
}) {
  const {
    roomId = '',
    problemId = '',
    sessionId = '',
  } = useParams<{ roomId: string; problemId: string; sessionId: string }>();

  return (
    <div className="grid grid-cols-2 gap-3 lg:row-span-2 [&>*]:min-w-0">
      <PrimaryActions basePath={basePath} isStudentEvalActive={isStudentEvalActive} />
      <ActionCard
        to={ROUTES.performanceTables}
        state={{ roomId, problemId, sessionId }}
        title="Fórmulas"
        desc="Suas tabelas de critérios"
        color="bg-amber-50 text-amber-600"
        Icon={AdjustmentsHorizontalIcon}
      />
      <ActionCard
        to={`${basePath}/historico`}
        title="Histórico de avaliações"
        desc="Comparar e ajustar com justificativa"
        color="bg-violet-50 text-violet-600"
        Icon={ClockIcon}
      />
      {children}
    </div>
  );
}
