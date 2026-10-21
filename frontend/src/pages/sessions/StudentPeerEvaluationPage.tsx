import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeftIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { UserMenuButton } from '@/components/layout/UserMenu';
import { Button } from '@/components/ui/Button';
import { CARD_CLASS, PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useAuth } from '@/hooks/useAuth';
import { sessionService } from '@/services/session.service';
import type { MemberSession } from '@/types/session';
import type { UserResponse } from '@/types/auth';
import { cn } from '@/utils/cn';

type Criterion = {
  id: string;
  title: string;
  weight: number;
  score: number;
};

type Peer = {
  id: string;
  name: string;
  criteria: Criterion[];
};

const INITIAL_PEERS: Peer[] = [
  {
    id: 'peer-1',
    name: 'Ana Souza',
    criteria: [
      { id: '1', title: 'Segmento', weight: 3.0, score: 8 },
      { id: '2', title: 'Participação', weight: 3.5, score: 6 },
      { id: '3', title: 'Cargo', weight: 2.0, score: 9 },
      { id: '4', title: 'Comportamento', weight: 1.5, score: 8 },
    ],
  },
  {
    id: 'peer-2',
    name: 'Carlos Lima',
    criteria: [
      { id: '1', title: 'Segmento', weight: 3.0, score: 8 },
      { id: '2', title: 'Participação', weight: 3.5, score: 6 },
      { id: '3', title: 'Cargo', weight: 2.0, score: 9 },
      { id: '4', title: 'Comportamento', weight: 1.5, score: 8 },
    ],
  },
];

type CriterionStepperProps = {
  criterion: Criterion;
  onChange: (id: string, newScore: number) => void;
};

function CriterionStepper({ criterion, onChange }: CriterionStepperProps) {
  const handleDecrease = () => onChange(criterion.id, Math.max(0, criterion.score - 1));
  const handleIncrease = () => onChange(criterion.id, Math.min(10, criterion.score + 1));

  return (
    <div
      role="group"
      aria-label={criterion.title}
      className="flex items-center justify-between border-b border-black/5 py-4 last:border-0"
    >
      <div className="flex flex-col">
        <span className="font-semibold text-brand-900">{criterion.title}</span>
        <span className="text-sm text-muted">
          Peso {criterion.weight.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleDecrease}
          disabled={criterion.score <= 0}
          className="flex size-10 items-center justify-center rounded-lg border border-black/10 bg-white text-brand-900 active:bg-surface disabled:opacity-50"
        >
          <span className="text-xl leading-none">&minus;</span>
        </button>
        <span className="w-6 text-center text-lg font-semibold text-ink">{criterion.score}</span>
        <button
          type="button"
          onClick={handleIncrease}
          disabled={criterion.score >= 10}
          className="flex size-10 items-center justify-center rounded-lg border border-black/10 bg-white text-brand-900 active:bg-surface disabled:opacity-50"
        >
          <span className="text-xl leading-none">+</span>
        </button>
      </div>
    </div>
  );
}

type PeerCardProps = {
  peer: Peer;
  onCriterionChange: (peerId: string, criterionId: string, newScore: number) => void;
};

function PeerEvaluationCard({ peer, onCriterionChange }: PeerCardProps) {
  return (
    <section aria-label={`Avaliação de ${peer.name}`} className={cn(CARD_CLASS, 'p-4')}>
      <div className="mb-2 flex items-center gap-4 border-b border-black/5 pb-4">
        <span className="flex size-12 items-center justify-center rounded-xl bg-surface">
          <UserCircleIcon className="size-7 text-ink" />
        </span>
        <span className="text-lg font-semibold text-ink">{peer.name}</span>
      </div>
      <div>
        {peer.criteria.map((criterion) => (
          <CriterionStepper
            key={criterion.id}
            criterion={criterion}
            onChange={(criterionId, newScore) => onCriterionChange(peer.id, criterionId, newScore)}
          />
        ))}
      </div>
    </section>
  );
}

function PeerEvaluationHeader({
  user,
  subtitle,
  onBack,
}: {
  user: Pick<UserResponse, 'id' | 'nome' | 'possuiFoto'> | null;
  subtitle: string;
  onBack: () => void;
}) {
  return (
    <header className="shrink-0 bg-brand-900 text-white">
      <div className={cn(PAGE_CONTAINER_CLASS, 'flex h-16 items-center justify-between')}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Voltar"
            className="-ml-1 rounded-full p-2 transition-[background-color,scale] duration-200 hover:bg-white/10 active:scale-90 focus-visible:outline-2 focus-visible:outline-white"
          >
            <ChevronLeftIcon className="size-6" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-base font-semibold leading-tight">Avaliação dos Colegas</h1>
            <span className="text-xs text-white/70">{subtitle}</span>
          </div>
        </div>
        <UserMenuButton user={user} className="ring-2 ring-white/20" />
      </div>
    </header>
  );
}

export default function StudentPeerEvaluationPage() {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [peers, setPeers] = useState<Peer[]>(INITIAL_PEERS);
  const [session, setSession] = useState<MemberSession | null>(null);

  const { run: loadSession } = useAsyncAction(
    useCallback(() => sessionService.getForMember(sessionId), [sessionId]),
  );

  useEffect(() => {
    loadSession().then((res) => res.ok && setSession(res.data));
  }, [loadSession]);

  const handleCriterionChange = (peerId: string, criterionId: string, newScore: number) => {
    setPeers((prev) =>
      prev.map((peer) => {
        if (peer.id !== peerId) return peer;
        return {
          ...peer,
          criteria: peer.criteria.map((c) =>
            c.id === criterionId ? { ...c, score: newScore } : c,
          ),
        };
      }),
    );
  };

  return (
    <div className="min-h-dvh bg-surface pb-24">
      <PeerEvaluationHeader
        user={user}
        subtitle={session?.titulo || 'Sessão'}
        onBack={() => navigate(-1)}
      />

      <main className={cn(PAGE_CONTAINER_CLASS, 'mt-6 flex flex-col gap-6')}>
        {peers.map((peer) => (
          <PeerEvaluationCard key={peer.id} peer={peer} onCriterionChange={handleCriterionChange} />
        ))}

        <Button onClick={() => navigate(-1)}>Salvar Avaliações</Button>
      </main>
    </div>
  );
}
