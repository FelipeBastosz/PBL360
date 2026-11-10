import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeftIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import { CardsIcon } from '../planning-poker/CardsIcon';
import { StudentEvaluationCard } from './components/StudentEvaluationCard';
import { useSessionGrades } from './hooks/useSessionGrades';
import { useSessionEvaluationsData } from './hooks/useSessionEvaluationsData';
import { UserMenuButton } from '@/components/layout/UserMenu';
import type { UserResponse } from '@/types/auth';
import { CARD_GRID_CLASS, PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';

function EvaluationsHeader({ user, backUrl }: { user: UserResponse | null; backUrl: string }) {
  return (
    <header className="shrink-0 bg-brand-900 text-white">
      <div className={cn(PAGE_CONTAINER_CLASS, 'flex h-16 items-center justify-between gap-3')}>
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to={backUrl}
            aria-label="Voltar para a sessão"
            className="-ml-1 shrink-0 rounded-full p-2 transition-[background-color,scale] duration-200 hover:bg-white/10 active:scale-90 focus-visible:outline-2 focus-visible:outline-white"
          >
            <ChevronLeftIcon className="size-6" />
          </Link>
          <div className="flex min-w-0 flex-col">
            <h1 className="truncate text-base font-semibold leading-tight">Avaliação</h1>
            <span className="text-xs text-white/70">Alunos</span>
          </div>
        </div>
        <UserMenuButton user={user} className="size-9 bg-brand-200 text-brand-900" />
      </div>
    </header>
  );
}

function MissingCriteriaAlert({ formulasUrl }: { formulasUrl: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <ExclamationTriangleIcon className="mt-0.5 size-6 shrink-0 text-amber-700" />
        <div>
          <h3 className="text-sm font-bold text-amber-900">Problema sem tabela vinculada</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-amber-800">
            Este problema ainda não possui critérios de avaliação configurados. Vincule uma tabela
            de fórmulas para liberar o lançamento de notas.
          </p>
        </div>
      </div>
      <Link
        to={formulasUrl}
        className="w-full rounded-xl bg-amber-700 py-2 text-center text-xs font-semibold text-white transition hover:bg-amber-800"
      >
        Configurar Fórmulas
      </Link>
    </div>
  );
}

function PendingRollCallAlert({ rollCallUrl }: { rollCallUrl: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-blue-300 bg-blue-50 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <ClipboardDocumentCheckIcon className="mt-0.5 size-6 shrink-0 text-brand-900" />
        <div>
          <h3 className="text-sm font-bold text-brand-900">Chamada pendente</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-ink/70">
            A chamada desta sessão ainda não foi salva. Registre a presença dos alunos para liberar
            as avaliações individuais.
          </p>
        </div>
      </div>
      <Link
        to={rollCallUrl}
        className="w-full rounded-xl bg-brand-900 py-2 text-center text-xs font-semibold text-white transition hover:bg-brand-800"
      >
        Realizar Chamada
      </Link>
    </div>
  );
}

function ActivePokerAlert({ pokerUrl }: { pokerUrl: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-brand-300 bg-brand-50 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <CardsIcon className="mt-0.5 size-6 shrink-0 text-brand-900" />
        <div>
          <h3 className="text-sm font-bold text-brand-900">Planning poker em andamento</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-ink/70">
            A avaliação direta do tutor está bloqueada enquanto o planning poker estiver ativo nesta
            sessão.
          </p>
        </div>
      </div>
      <Link
        to={pokerUrl}
        className="w-full rounded-xl bg-brand-900 py-2 text-center text-xs font-semibold text-white transition hover:bg-brand-800"
      >
        Ir para o Planning Poker
      </Link>
    </div>
  );
}

export default function SessionEvaluationsListPage() {
  const { roomId, problemId, sessionId } = useParams<{
    roomId: string;
    problemId: string;
    sessionId: string;
  }>();
  const { user } = useAuth();
  const { students, isLoading, error, hasMissingTable, hasPendingRollCall, hasOpenPoker } =
    useSessionEvaluationsData(sessionId, roomId, problemId);
  const sessionGrades = useSessionGrades(roomId, problemId, sessionId);

  const backUrl = `/turmas/${roomId}/problemas/${problemId}/sessoes/${sessionId}`;
  const formulasUrl = `/turmas/${roomId}/problemas/${problemId}/sessoes/${sessionId}/formulas`;
  const rollCallUrl = `/turmas/${roomId}/problemas/${problemId}/sessoes/${sessionId}/chamada`;
  const pokerUrl = `/turmas/${roomId}/problemas/${problemId}/sessoes/${sessionId}/planning-poker`;

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <EvaluationsHeader user={user} backUrl={backUrl} />
      <main className={cn(PAGE_CONTAINER_CLASS, 'mt-6 flex flex-col gap-4')}>
        {error && <Alert tone="error">{error.message}</Alert>}
        {hasOpenPoker && <ActivePokerAlert pokerUrl={pokerUrl} />}
        {!hasOpenPoker && hasMissingTable && <MissingCriteriaAlert formulasUrl={formulasUrl} />}
        {!hasOpenPoker && !hasMissingTable && hasPendingRollCall && (
          <PendingRollCallAlert rollCallUrl={rollCallUrl} />
        )}

        {isLoading ? (
          <div className="mt-10 flex justify-center">
            <Spinner className="size-8 text-brand-900" />
          </div>
        ) : (
          <div className={CARD_GRID_CLASS}>
            {students.map((student) => (
              <StudentEvaluationCard
                key={student.alunoId}
                student={student}
                sessionGrade={sessionGrades.get(student.alunoId)}
                disabled={hasMissingTable || hasPendingRollCall || hasOpenPoker}
                evaluationUrl={`/sessoes/${sessionId}/avaliacao/${student.alunoId}`}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
