import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { countLabel } from '@/utils/countLabel';
import { TutorRow } from './TutorRow';
import { TutorSearch } from './TutorSearch';
import { useRoomTutors } from './useRoomTutors';

type TutorsTabProps = {
  roomId: string;
  isOwner: boolean;
};

export function TutorsTab({ roomId, isOwner }: TutorsTabProps) {
  const { tutors, isLoading, error, pendingId, add, remove } = useRoomTutors(roomId);

  return (
    <div className="flex flex-col gap-5">
      {isOwner ? (
        <TutorSearch existingIds={tutors.map((t) => t.id)} pendingId={pendingId} onAdd={add} />
      ) : (
        <p className="rounded-xl bg-brand-50 p-3 text-sm text-brand-900">
          Só o professor responsável pela turma pode convidar ou remover professores.
        </p>
      )}
      <section>
        <h3 className="text-sm font-semibold text-muted">
          Professores da turma · {countLabel(tutors.length, 'professor', 'professores')}
        </h3>
        {error && (
          <Alert tone="error" className="mt-3">
            {error.message}
          </Alert>
        )}
        {isLoading && !tutors.length ? (
          <div className="flex justify-center py-6">
            <Spinner className="size-6 text-brand-900" />
          </div>
        ) : (
          <ul className="stagger-in divide-y divide-black/5">
            {tutors.map((tutor) => (
              <TutorRow
                key={tutor.id}
                tutor={tutor}
                canRemove={isOwner}
                isPending={pendingId === tutor.id}
                onRemove={remove}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
