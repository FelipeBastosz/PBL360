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
        <p className="rounded-xl bg-brand-soft p-3 text-sm text-brand-accent">
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
            <Spinner className="size-6 text-brand-accent" />
          </div>
        ) : (
          <ul className="stagger-in divide-y divide-border-subtle">
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
