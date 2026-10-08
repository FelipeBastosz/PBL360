import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { observationService } from '@/services/observation.service';
import type { BehaviorTag, ObservationItem } from '@/types/observation';
import { EvaluationHeader } from './components/EvaluationHeader';

function TagRowActions({
  tag,
  count,
  onIncrement,
  onDecrement,
}: {
  tag: BehaviorTag;
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  if (count > 0) {
    return (
      <>
        <button
          type="button"
          aria-label={`Diminuir ${tag.nome}`}
          onClick={onDecrement}
          className="flex size-7 items-center justify-center rounded-lg border border-brand-900/20 bg-gray-50 text-xs font-bold text-brand-900 transition hover:bg-brand-100 active:scale-95"
        >
          −
        </button>
        <span className="rounded-full bg-brand-900 px-3 py-1 text-xs font-bold text-white shadow-xs">
          {count} marcações
        </span>
        <button
          type="button"
          aria-label={`Aumentar ${tag.nome}`}
          onClick={onIncrement}
          className="flex size-7 items-center justify-center rounded-lg border border-brand-900/20 bg-gray-50 text-xs font-bold text-brand-900 transition hover:bg-brand-100 active:scale-95"
        >
          +
        </button>
      </>
    );
  }

  return (
    <button
      type="button"
      onClick={onIncrement}
      className="flex items-center gap-1 rounded-full border border-brand-900 bg-white px-3.5 py-1 text-xs font-bold text-brand-900 transition hover:bg-brand-50 active:scale-95"
    >
      <PlusIcon className="size-3.5 stroke-[2.5]" />
      <span>Marcar</span>
    </button>
  );
}

function TagRow({
  tag,
  count,
  onIncrement,
  onDecrement,
}: {
  tag: BehaviorTag;
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <div className="flex w-full items-center justify-between rounded-xl border border-black/5 bg-white p-3.5 shadow-xs">
      <span className="text-sm font-semibold text-brand-900">{tag.nome}</span>
      <div className="flex items-center gap-2">
        <TagRowActions
          tag={tag}
          count={count}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
        />
      </div>
    </div>
  );
}

function CreateTagSection({ onCreate }: { onCreate: (nome: string) => void }) {
  const [nome, setNome] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (nome.trim()) {
      onCreate(nome.trim());
      setNome('');
      setIsFormOpen(false);
    }
  }

  if (!isFormOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsFormOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-brand-900/40 bg-brand-50/50 py-3 text-xs font-bold text-brand-900 hover:bg-brand-50"
      >
        <PlusIcon className="size-4" />
        <span>criar nova marcação</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        placeholder="Nome da nova marcação"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        autoFocus
        className="h-10 flex-1 rounded-xl border border-brand-900 px-3 text-xs text-ink focus:outline-none"
      />
      <button
        type="submit"
        className="rounded-xl bg-brand-900 px-4 text-xs font-bold text-white hover:bg-brand-800"
      >
        Salvar
      </button>
      <button
        type="button"
        onClick={() => setIsFormOpen(false)}
        className="px-2 text-xs font-semibold text-muted"
      >
        Cancelar
      </button>
    </form>
  );
}

function useStudentObservationTags(sessionId: string, studentId: string) {
  const [tags, setTags] = useState<BehaviorTag[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [observations, setObservations] = useState<ObservationItem[]>([]);

  const fetchTagsData = useCallback(async () => {
    const [tagList, obsData] = await Promise.all([
      observationService.listTags(),
      observationService.listStudentObservations(sessionId, studentId),
    ]);
    return { tagList, obsData };
  }, [sessionId, studentId]);

  const { run, isLoading, error } = useAsyncAction(fetchTagsData);

  useEffect(() => {
    if (sessionId && studentId) {
      run().then((res) => {
        if (res.ok) {
          setTags(res.data.tagList);
          setCounts(res.data.obsData.contagem);
          setObservations(res.data.obsData.observacoes);
        }
      });
    }
  }, [sessionId, studentId, run]);

  async function handleIncrement(tagId: string) {
    setCounts((prev) => ({ ...prev, [tagId]: (prev[tagId] ?? 0) + 1 }));
    const created = await observationService.registerObservation(sessionId, studentId, {
      marcacaoIds: [tagId],
    });
    setObservations((prev) => [...prev, created]);
  }

  async function handleDecrement(tagId: string) {
    setCounts((prev) => ({ ...prev, [tagId]: Math.max(0, (prev[tagId] ?? 1) - 1) }));
    const target = observations
      .slice()
      .reverse()
      .find((o) => o.marcacoes.some((m) => m.id === tagId));
    if (target) {
      setObservations((prev) => prev.filter((o) => o.id !== target.id));
      await observationService.undoObservation(target.id).catch(() => null);
    }
  }

  async function handleCreateTag(nome: string) {
    const created = await observationService.createTag(nome);
    setTags((prev) => [...prev, created]);
    handleIncrement(created.id);
  }

  return { tags, counts, isLoading, error, handleIncrement, handleDecrement, handleCreateTag };
}

export function StudentObservationTagsPage() {
  const { sessionId = '', studentId = '' } = useParams<{ sessionId: string; studentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const studentName = (location.state as { studentName?: string })?.studentName || 'Aluno';

  const { tags, counts, isLoading, error, handleIncrement, handleDecrement, handleCreateTag } =
    useStudentObservationTags(sessionId, studentId);

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <EvaluationHeader onBack={() => navigate(-1)} />
      <main className="mx-auto mt-4 flex w-full max-w-md flex-col gap-4 px-4">
        {isLoading && (
          <div className="mt-12 flex justify-center">
            <Spinner className="size-8 text-brand-900" />
          </div>
        )}
        {error && <Alert tone="error">{error.message}</Alert>}
        {!isLoading && (
          <div className="flex flex-col gap-3">
            <h2 className="text-base font-bold text-brand-900">
              Todas as marcações: {studentName}
            </h2>
            <CreateTagSection onCreate={handleCreateTag} />
            <div className="flex flex-col gap-2">
              {tags.map((tag) => (
                <TagRow
                  key={tag.id}
                  tag={tag}
                  count={counts[tag.id] ?? 0}
                  onIncrement={() => handleIncrement(tag.id)}
                  onDecrement={() => handleDecrement(tag.id)}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mt-4 w-full rounded-2xl bg-brand-900 py-3.5 text-base font-bold text-white shadow-lg hover:bg-brand-800"
            >
              Concluir
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default StudentObservationTagsPage;
