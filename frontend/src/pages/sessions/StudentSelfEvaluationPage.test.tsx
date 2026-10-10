import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { CARD_CLASS, PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuth } from '@/hooks/useAuth';
import type { UserResponse } from '@/types/auth';
import { cn } from '@/utils/cn';

type Criterion = {
  id: string;
  title: string;
  weight: number;
  score: number;
};

const INITIAL_CRITERIA: Criterion[] = [
  { id: '1', title: 'Segmento', weight: 3.0, score: 8 },
  { id: '2', title: 'Participação', weight: 3.5, score: 6 },
  { id: '3', title: 'Cargo', weight: 2.0, score: 9 },
  { id: '4', title: 'Comportamento', weight: 1.5, score: 8 },
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

type HeaderProps = {
  user: Pick<UserResponse, 'id' | 'nome' | 'possuiFoto'> | null;
  onBack: () => void;
};

function SelfEvaluationHeader({ user, onBack }: HeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between bg-brand-900 px-4 text-white">
      <div className="flex items-center gap-3">
        <button onClick={onBack} aria-label="Voltar" className="rounded-md p-1 hover:bg-white/10">
          <ChevronLeftIcon className="size-6" />
        </button>
        <div className="flex flex-col">
          <h1 className="text-base font-semibold leading-tight">Autoavaliação</h1>
          <span className="text-xs text-white/70">Sessão · 12 ago</span>
        </div>
      </div>
      <UserAvatar
        user={user ?? { id: '', nome: '', possuiFoto: false }}
        className="ring-2 ring-white/20"
      />
    </header>
  );
}

export default function StudentSelfEvaluationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [criteria, setCriteria] = useState<Criterion[]>(INITIAL_CRITERIA);

  const handleScoreChange = (id: string, newScore: number) => {
    setCriteria((prev) => prev.map((c) => (c.id === id ? { ...c, score: newScore } : c)));
  };

  return (
    <div className="min-h-dvh bg-surface pb-24">
      <SelfEvaluationHeader user={user} onBack={() => navigate(-1)} />

      <main className={cn(PAGE_CONTAINER_CLASS, 'mt-6 flex flex-col gap-6')}>
        <div className={cn(CARD_CLASS, 'flex-row items-center gap-4 p-4')}>
          <span className="flex size-12 items-center justify-center rounded-xl bg-surface">
            <UserCircleIcon className="size-7 text-ink" />
          </span>
          <span className="text-lg font-semibold text-ink">{user?.nome || 'Aluno'}</span>
        </div>

        <div className={cn(CARD_CLASS, 'px-4')}>
          {criteria.map((criterion) => (
            <CriterionStepper
              key={criterion.id}
              criterion={criterion}
              onChange={handleScoreChange}
            />
          ))}
        </div>

        <Button onClick={() => navigate(-1)}>Salvar Autoavaliação</Button>
      </main>
    </div>
  );
}
