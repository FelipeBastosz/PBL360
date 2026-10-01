import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { roomService } from '@/services/room.service';
import { problemService } from '@/services/problem.service';
import type { Room } from '@/types/room';
import type { Problem, ProblemDeletionImpact } from '@/types/problem';
import { RoomProblemsHeader } from './RoomProblemsHeader';
import { DeleteProblemModal } from './DeleteProblemModal';
import { ProblemFormModal } from './ProblemFormModal';

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
    <div className="flex items-center justify-between rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
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
    <main className="mx-auto mt-6 flex w-full max-w-md flex-col gap-3 px-4">
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

type DeleteHandlerParams = {
  id: string | undefined;
  p: Problem;
  setProblemToDelete: (p: Problem | null) => void;
  setImpact: (i: ProblemDeletionImpact | null) => void;
};

type ConfirmDeleteParams = {
  id: string | undefined;
  problemToDelete: Problem | null;
  deleteProblem: (
    ...args: [string, string]
  ) => Promise<{ ok: true; data: void } | { ok: false; error: unknown }>;
  setProblems: React.Dispatch<React.SetStateAction<Problem[]>>;
  setProblemToDelete: (p: Problem | null) => void;
  notify: (toast: { tone: 'success' | 'error' | 'info'; message: string }) => void;
};

async function handleOpenDelete({ id, p, setProblemToDelete, setImpact }: DeleteHandlerParams) {
  setProblemToDelete(p);
  if (!id) return;
  const data = await problemService
    .getDeletionImpact(id, p.id)
    .catch(() => ({ sessoes: 0, notas: 0, feedbacks: 0, avaliacoes: 0 }));
  setImpact(data);
}

async function handleConfirmDelete({
  id,
  problemToDelete,
  deleteProblem,
  setProblems,
  setProblemToDelete,
  notify,
}: ConfirmDeleteParams) {
  if (!id || !problemToDelete) return;
  const res = await deleteProblem(id, problemToDelete.id);
  if (res.ok) {
    setProblems((curr) => curr.filter((item) => item.id !== problemToDelete.id));
    setProblemToDelete(null);
    notify({ tone: 'success', message: 'Problema excluído com sucesso!' });
  }
}

function useManageProblems(id: string | undefined) {
  const { notify } = useToast();
  const [room, setRoom] = useState<Room | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [problemToEdit, setProblemToEdit] = useState<Problem | null>(null);
  const [problemToDelete, setProblemToDelete] = useState<Problem | null>(null);
  const [impact, setImpact] = useState<ProblemDeletionImpact | null>(null);

  const { run: fetchRoom } = useAsyncAction(roomService.getById);
  const { run: fetchProblems, isLoading } = useAsyncAction(problemService.list);
  const { run: deleteProblem, isLoading: isDeleting } = useAsyncAction(problemService.remove);

  useEffect(() => {
    if (!id) return;
    fetchRoom(id).then((r) => r.ok && setRoom(r.data));
    fetchProblems(id).then((r) => r.ok && setProblems(r.data as Problem[]));
  }, [id, fetchRoom, fetchProblems]);

  return {
    room,
    problems,
    isLoading,
    isDeleting,
    problemToEdit,
    setProblemToEdit,
    problemToDelete,
    setProblemToDelete,
    impact,
    onOpenDelete: (p: Problem) => handleOpenDelete({ id, p, setProblemToDelete, setImpact }),
    onConfirmDelete: () =>
      handleConfirmDelete({
        id,
        problemToDelete,
        deleteProblem,
        setProblems,
        setProblemToDelete,
        notify,
      }),
    handleEditSuccess: (updated: Problem) => {
      setProblems((curr) => curr.map((item) => (item.id === updated.id ? updated : item)));
      setProblemToEdit(null);
      notify({ tone: 'success', message: 'Problema atualizado com sucesso!' });
    },
  };
}

export default function ManageProblemsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const state = useManageProblems(id);

  return (
    <div className="min-h-dvh bg-surface pb-36">
      <RoomProblemsHeader room={state.room} userNome={user?.nome} />
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
        onCancelDelete={() => state.setProblemToDelete(null)}
        onEditSuccess={state.handleEditSuccess}
        onCloseEdit={() => state.setProblemToEdit(null)}
      />
    </div>
  );
}
