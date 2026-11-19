import { useState } from 'react';
import { PencilSquareIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import type { SessionGeneralEvaluation } from '@/types/session';
import { useSessionGeneralEvaluations } from './hooks/useSessionGeneralEvaluations';
import { SessionGeneralEvaluationItem } from './SessionGeneralEvaluationItem';
import { SessionGeneralEvaluationModal } from './SessionGeneralEvaluationModal';

type SessionGeneralEvaluationCardProps = {
  sessionId: string;
  isProfessor: boolean;
};

type CardHeaderProps = {
  isProfessor: boolean;
  isLoading: boolean;
  hasEvaluation: boolean;
  onOpenModal: () => void;
};

function CardHeader({ isProfessor, isLoading, hasEvaluation, onOpenModal }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="text-base font-bold text-brand-900">Avaliação Geral da Sessão</h3>
        <p className="mt-0.5 text-xs text-muted">
          Parecer da tutoria sobre o desempenho da turma na sessão, visível para todos os alunos.
        </p>
      </div>
      {isProfessor && !isLoading && (
        <Button
          type="button"
          variant={hasEvaluation ? 'outline' : 'primary'}
          onClick={onOpenModal}
          className="h-9 shrink-0 gap-1.5 px-3 text-xs"
        >
          {hasEvaluation ? (
            <>
              <PencilSquareIcon className="size-4" />
              <span>Editar</span>
            </>
          ) : (
            <>
              <PlusIcon className="size-4" />
              <span>Registrar</span>
            </>
          )}
        </Button>
      )}
    </div>
  );
}

function CardEmptyState({
  isProfessor,
  onOpenModal,
}: {
  isProfessor: boolean;
  onOpenModal: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-black/10 py-6 px-4 text-center">
      {isProfessor ? (
        <>
          <p className="text-sm font-medium text-ink">
            Nenhuma avaliação geral registrada para a turma ainda.
          </p>
          <p className="mt-1 text-xs text-muted">
            Registre uma avaliação para que os alunos possam acompanhar o parecer da tutoria.
          </p>
          <Button
            type="button"
            variant="primary"
            onClick={onOpenModal}
            className="mt-3.5 h-8 gap-1.5 px-3.5 text-xs"
          >
            <PlusIcon className="size-3.5" />
            <span>Registrar avaliação</span>
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted">A avaliação geral da sessão ainda não está disponível.</p>
      )}
    </div>
  );
}

function CardErrorState({ error, onReload }: { error: string; onReload: () => void }) {
  return (
    <div className="flex flex-col gap-2">
      <Alert tone="error">{error}</Alert>
      <Button
        type="button"
        variant="outline"
        onClick={onReload}
        className="self-start text-xs h-8 px-3"
      >
        Tentar novamente
      </Button>
    </div>
  );
}

type CardBodyProps = {
  isLoading: boolean;
  error: string | null;
  evaluations: SessionGeneralEvaluation[];
  isProfessor: boolean;
  currentUserId?: string;
  onReload: () => void;
  onOpenModal: () => void;
};

function CardBody({
  isLoading,
  error,
  evaluations,
  isProfessor,
  currentUserId,
  onReload,
  onOpenModal,
}: CardBodyProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner className="size-6 text-brand-900" />
      </div>
    );
  }
  if (error) return <CardErrorState error={error} onReload={onReload} />;
  if (evaluations.length === 0) {
    return <CardEmptyState isProfessor={isProfessor} onOpenModal={onOpenModal} />;
  }

  return (
    <div className="flex flex-col gap-3">
      {evaluations.map((item) => (
        <SessionGeneralEvaluationItem
          key={item.id}
          evaluation={item}
          isAuthor={item.autor.id === currentUserId}
          canEdit={Boolean(isProfessor && item.autor.id === currentUserId)}
          onEdit={onOpenModal}
        />
      ))}
    </div>
  );
}

export function SessionGeneralEvaluationCard({
  sessionId,
  isProfessor,
}: SessionGeneralEvaluationCardProps) {
  const { user } = useAuth();
  const { evaluations, setEvaluations, isLoading, error, reload } =
    useSessionGeneralEvaluations(sessionId);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const myEvaluation =
    evaluations.find((e) => e.autor.id === user?.id) ??
    (evaluations.length === 1 && isProfessor ? evaluations[0] : null);

  const handleSaved = (saved: SessionGeneralEvaluation) => {
    setEvaluations((prev) => {
      const idx = prev.findIndex((e) => e.id === saved.id);
      return idx >= 0 ? prev.map((e, i) => (i === idx ? saved : e)) : [saved, ...prev];
    });
  };

  return (
    <div className="relative flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <CardHeader
        isProfessor={isProfessor}
        isLoading={isLoading}
        hasEvaluation={Boolean(myEvaluation)}
        onOpenModal={() => setIsModalOpen(true)}
      />

      <CardBody
        isLoading={isLoading}
        error={error}
        evaluations={evaluations}
        isProfessor={isProfessor}
        currentUserId={user?.id}
        onReload={reload}
        onOpenModal={() => setIsModalOpen(true)}
      />

      <SessionGeneralEvaluationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sessionId={sessionId}
        existingEvaluation={myEvaluation}
        onSaved={handleSaved}
      />
    </div>
  );
}
