import { Link, useParams } from 'react-router-dom';
import {
  ClipboardDocumentCheckIcon,
  StarIcon,
  AdjustmentsHorizontalIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import type { ComponentType, ReactNode } from 'react';
import { ROUTES } from '@/routes/paths';
import type { ApplyTarget } from '@/utils/navigationState';

type GridProps = {
  basePath: string;
  isStudentEvalActive: boolean;
  children?: ReactNode;
};

function ActionCardContent({
  title,
  desc,
  color,
  Icon,
}: {
  title: string;
  desc: string;
  color: string;
  Icon: ComponentType<{ className?: string }>;
}) {
  return (
    <>
      <div className={`flex size-11 items-center justify-center rounded-xl ${color}`}>
        <Icon className="size-6" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-ink">{title}</h3>
        <p className="mt-1 text-xs text-muted leading-relaxed">{desc}</p>
      </div>
    </>
  );
}

function ActionCard({
  to,
  title,
  desc,
  color,
  Icon,
  disabled,
  badge,
  state,
}: {
  to: string;
  title: string;
  desc: string;
  color: string;
  Icon: ComponentType<{ className?: string }>;
  disabled?: boolean;
  badge?: string;
  state?: ApplyTarget;
}) {
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

export function SessionActionGrid({ basePath, isStudentEvalActive, children }: GridProps) {
  const { roomId = '', problemId = '' } = useParams<{ roomId: string; problemId: string }>();

  return (
    <div className="grid grid-cols-2 gap-3">
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
        desc={
          isStudentEvalActive
            ? 'Avaliações ativas. Consulte e ajuste no Histórico de avaliações.'
            : 'Critérios, marcações e feedback'
        }
        color={isStudentEvalActive ? 'bg-gray-100 text-gray-400' : 'bg-emerald-50 text-emerald-600'}
        Icon={StarIcon}
        disabled={isStudentEvalActive}
        badge={isStudentEvalActive ? 'Bloqueado' : undefined}
      />

      <ActionCard
        to={ROUTES.performanceTables}
        state={{ roomId, problemId }}
        title="Fórmulas"
        desc="Pesos da sessão e da nota final"
        color="bg-amber-50 text-amber-600"
        Icon={AdjustmentsHorizontalIcon}
      />

      <ActionCard
        to={`${basePath}/historico`}
        title="Histórico de avaliações"
        desc="Comparar e ajustar com justificativa"
        color="bg-gray-100 text-gray-600"
        Icon={ClockIcon}
      />
      {children}
    </div>
  );
}
