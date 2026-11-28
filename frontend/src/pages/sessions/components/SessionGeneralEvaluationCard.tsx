import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import type { SessionGeneralEvaluation } from '@/types/session';
import { cn } from '@/utils/cn';
import { useSessionGeneralEvaluations } from './hooks/useSessionGeneralEvaluations';
import { ProfessorEvaluationSummary } from './ProfessorEvaluationSummary';
import { SessionGeneralEvaluationItem } from './SessionGeneralEvaluationItem';
import { SessionGeneralEvaluationModal } from './SessionGeneralEvaluationModal';

type SessionGeneralEvaluationCardProps = {
  sessionId: string;
  isProfessor: boolean;
  className?: string;
};

function CardHeader() {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-bold text-brand-accent">Feedback Geral da Sessão</h3>
        <p className="mt-0.5 text-xs text-muted">
          Parecer da tutoria sobre o desempenho da turma na sessão, visível para todos os alunos.
        </p>
      </div>
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
  if (!isProfessor) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border-subtle bg-surface/50 py-4 px-4 text-center">
        <p className="text-sm text-muted">O feedback geral da sessão ainda não está disponível.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-6 px-4 text-center">
      <p className="text-sm font-medium text-ink">
        Nenhum feedback geral registrado para a turma ainda.
      </p>
      <p className="mt-1 text-xs text-muted">
        Registre um feedback para que os alunos possam acompanhar o parecer da tutoria.
      </p>
      <Button
        type="button"
        variant="primary"
        onClick={onOpenModal}
        className="mt-3.5 !h-9 !w-auto shrink-0 gap-1.5 px-4 !text-xs !shadow-sm"
      >
        <PlusIcon className="size-4" />
        <span>Registrar feedback</span>
      </Button>
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

type ProfessorListProps = {
  evaluations: SessionGeneralEvaluation[];
  currentUserId?: string;
  myEvaluation: SessionGeneralEvaluation | null;
  onOpenEdit: (item: SessionGeneralEvaluation) => void;
  onOpenCreate: () => void;
};

function ProfessorEvaluationsList({
  evaluations,
  currentUserId,
  myEvaluation,
  onOpenEdit,
  onOpenCreate,
}: ProfessorListProps) {
  return (
    <div className="flex flex-col gap-3">
      {evaluations.map((item) => {
        const isAuthor = item.autor.id === currentUserId;
        return (
          <ProfessorEvaluationSummary
            key={item.id}
            evaluation={item}
            isAuthor={isAuthor}
            canEdit={isAuthor}
            onOpenModal={() => onOpenEdit(item)}
          />
        );
      })}
      {!myEvaluation && (
        <Button
          type="button"
          variant="outline"
          onClick={onOpenCreate}
          className="self-start text-xs h-8 px-3 gap-1.5"
        >
          <PlusIcon className="size-4" />
          <span>Registrar meu feedback</span>
        </Button>
      )}
    </div>
  );
}

type CardBodyProps = {
  isLoading: boolean;
  error: string | null;
  evaluations: SessionGeneralEvaluation[];
  isProfessor: boolean;
  currentUserId?: string;
  myEvaluation: SessionGeneralEvaluation | null;
  onReload: () => void;
  onOpenCreate: () => void;
  onOpenEdit: (item: SessionGeneralEvaluation) => void;
};

function CardBody({
  isLoading,
  error,
  evaluations,
  isProfessor,
  currentUserId,
  myEvaluation,
  onReload,
  onOpenCreate,
  onOpenEdit,
}: CardBodyProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner className="size-6 text-brand-accent" />
      </div>
    );
  }
  if (error) return <CardErrorState error={error} onReload={onReload} />;
  if (evaluations.length === 0) {
    return <CardEmptyState isProfessor={isProfessor} onOpenModal={onOpenCreate} />;
  }
  if (isProfessor) {
    return (
      <ProfessorEvaluationsList
        evaluations={evaluations}
        currentUserId={currentUserId}
        myEvaluation={myEvaluation}
        onOpenEdit={onOpenEdit}
        onOpenCreate={onOpenCreate}
      />
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {evaluations.map((item) => (
        <SessionGeneralEvaluationItem
          key={item.id}
          evaluation={item}
          isAuthor={item.autor.id === currentUserId}
          canEdit={false}
          onEdit={() => {}}
        />
      ))}
    </div>
  );
}

function useEvaluationModalState(
  setEvaluations: React.Dispatch<React.SetStateAction<SessionGeneralEvaluation[]>>,
  currentUserId?: string,
) {
  const [selectedEvaluation, setSelectedEvaluation] = useState<SessionGeneralEvaluation | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openCreate = () => {
    setSelectedEvaluation(null);
    setIsModalOpen(true);
  };
  const openEdit = (item: SessionGeneralEvaluation) => {
    setSelectedEvaluation(item);
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  const handleSaved = (saved: SessionGeneralEvaluation | null) => {
    setEvaluations((prev) => {
      if (!saved) {
        if (selectedEvaluation) return prev.filter((e) => e.id !== selectedEvaluation.id);
        return currentUserId ? prev.filter((e) => e.autor.id !== currentUserId) : prev;
      }
      const idx = prev.findIndex((e) => e.id === saved.id);
      return idx >= 0 ? prev.map((e, i) => (i === idx ? saved : e)) : [saved, ...prev];
    });
  };

  return { selectedEvaluation, isModalOpen, openCreate, openEdit, closeModal, handleSaved };
}

export function SessionGeneralEvaluationCard({
  sessionId,
  isProfessor,
  className,
}: SessionGeneralEvaluationCardProps) {
  const { user } = useAuth();
  const { evaluations, setEvaluations, isLoading, error, reload } =
    useSessionGeneralEvaluations(sessionId);
  const modal = useEvaluationModalState(setEvaluations, user?.id);
  const myEvaluation = evaluations.find((e) => e.autor.id === user?.id) ?? null;

  return (
    <div
      className={cn(
        'relative flex flex-col gap-3 rounded-2xl border border-border-subtle bg-elevated p-5 shadow-sm',
        className,
      )}
    >
      <CardHeader />
      <CardBody
        isLoading={isLoading}
        error={error}
        evaluations={evaluations}
        isProfessor={isProfessor}
        currentUserId={user?.id}
        myEvaluation={myEvaluation}
        onReload={reload}
        onOpenCreate={modal.openCreate}
        onOpenEdit={modal.openEdit}
      />
      <SessionGeneralEvaluationModal
        isOpen={modal.isModalOpen}
        onClose={modal.closeModal}
        sessionId={sessionId}
        existingEvaluation={modal.selectedEvaluation}
        onSaved={modal.handleSaved}
      />
    </div>
  );
}
