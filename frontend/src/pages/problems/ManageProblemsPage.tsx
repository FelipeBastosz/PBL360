import { useNavigate, useParams } from 'react-router-dom';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { CARD_CLASS, CARD_GRID_CLASS, PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';
import { useAuth } from '@/hooks/useAuth';
import type { Problem, ProblemDeletionImpact } from '@/types/problem';
import { RoomProblemsHeader } from './RoomProblemsHeader';
import { DeleteProblemModal } from './DeleteProblemModal';
import { ProblemFormModal } from './ProblemFormModal';
import { useManageProblems } from './hooks/useManageProblems';

function ManageProblemCard({
  problem,
  onEdit,
  onDelete,
}: {
  problem: Problem;
  onEdit: (p: Problem) => void;
  onDelete: (p: Problem) => void;
}) {
  return (
    <div className={cn(CARD_CLASS, 'flex-row items-center justify-between gap-3 p-4')}>
      <h3 className="font-bold text-ink">{problem.titulo}</h3>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onEdit(problem)}
          aria-label={`Editar ${problem.titulo}`}
          className="p-1 text-ink/70 hover:text-brand-900 focus-visible:outline-2"
        >
          <PencilIcon className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(problem)}
          aria-label={`Excluir ${problem.titulo}`}
          className="p-1 text-danger hover:text-danger/80 focus-visible:outline-2 focus-visible:outline-danger"
        >
          <TrashIcon className="size-5" />
        </button>
      </div>
    </div>
  );
}

function ManageFooter({ onFinish }: { onFinish: () => void }) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t border-black/5 bg-surface/95 px-6 py-4 backdrop-blur-xs">
      <div className="mx-auto flex max-w-md flex-col gap-2">
        <Button onClick={onFinish}>Concluir edição</Button>
        <Button variant="link" onClick={onFinish}>
          Cancelar
        </Button>
      </div>
    </footer>
  );
}

type ContentProps = {
  isLoading: boolean;
  problems: Problem[];
  onEdit: (p: Problem) => void;
  onDelete: (p: Problem) => void;
};

function ManageProblemsContent({ isLoading, problems, onEdit, onDelete }: ContentProps) {
  if (isLoading) {
    return (
      <div className="mt-10 flex justify-center">
        <Spinner className="size-8 text-brand-900" />
      </div>
    );
  }
  return (
    <main className={cn(PAGE_CONTAINER_CLASS, CARD_GRID_CLASS, 'mt-6')}>
      {problems.map((p) => (
        <ManageProblemCard key={p.id} problem={p} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </main>
  );
}

type ModalsProps = {
  id: string;
  problemToDelete: Problem | null;
  impact: ProblemDeletionImpact | null;
  isDeleting: boolean;
  problemToEdit: Problem | null;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onEditSuccess: (updated: Problem) => void;
  onCloseEdit: () => void;
};

function ManageProblemModals({
  id,
  problemToDelete,
  impact,
  isDeleting,
  problemToEdit,
  onConfirmDelete,
  onCancelDelete,
  onEditSuccess,
  onCloseEdit,
}: ModalsProps) {
  return (
    <>
      <DeleteProblemModal
        problemTitle={problemToDelete?.titulo ?? ''}
        impact={impact}
        isOpen={Boolean(problemToDelete)}
        isLoading={isDeleting}
        onConfirm={onConfirmDelete}
        onCancel={onCancelDelete}
      />
      <ProblemFormModal
        isOpen={Boolean(problemToEdit)}
        roomId={id}
        initialData={problemToEdit}
        onClose={onCloseEdit}
        onSuccess={onEditSuccess}
      />
    </>
  );
}

export default function ManageProblemsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const state = useManageProblems(id);

  return (
    <div className="min-h-dvh bg-surface pb-36">
      <RoomProblemsHeader room={state.room} user={user} />
      <ManageProblemsContent
        isLoading={state.isLoading}
        problems={state.problems}
        onEdit={state.setProblemToEdit}
        onDelete={state.onOpenDelete}
      />
      <ManageFooter onFinish={() => navigate(`/turmas/${id}/problemas`)} />
      <ManageProblemModals
        id={id ?? ''}
        problemToDelete={state.problemToDelete}
        impact={state.impact}
        isDeleting={state.isDeleting}
        problemToEdit={state.problemToEdit}
        onConfirmDelete={state.onConfirmDelete}
        onCancelDelete={state.onCancelDelete}
        onEditSuccess={state.handleEditSuccess}
        onCloseEdit={() => state.setProblemToEdit(null)}
      />
    </div>
  );
}
