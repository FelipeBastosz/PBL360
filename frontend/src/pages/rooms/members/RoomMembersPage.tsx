import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert } from '@/components/ui/Alert';
import { SearchField } from '@/components/ui/SearchField';
import { Spinner } from '@/components/ui/Spinner';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { useAuth } from '@/hooks/useAuth';
import { RoomProblemsHeader } from '@/pages/problems/RoomProblemsHeader';
import { ROUTES } from '@/routes/paths';
import { cn } from '@/utils/cn';
import { matchesName } from '@/utils/members';
import { MemberCard, MemberSection } from './MemberCard';
import { MemberDetailsSheet, type SelectedMember } from './MemberDetailsSheet';
import { type RoomMembers, useRoomMembers } from './useRoomMembers';

type MembersListProps = {
  members: RoomMembers;
  query: string;
  // The photo route only lets students see their own photo; tutors see everyone's.
  canSeePhotoOf: (userId: string) => boolean;
  onSelect: (member: SelectedMember) => void;
};

const notFoundMessage = (query: string) =>
  query.trim() ? 'Ninguém encontrado com esse nome.' : null;

function StudentsSection({ members, query, canSeePhotoOf, onSelect }: MembersListProps) {
  const students = members.students.filter((student) => matchesName(student.nome, query));

  return (
    <MemberSection
      title="Alunos"
      count={students.length}
      emptyMessage={notFoundMessage(query) ?? 'Nenhum aluno entrou nesta turma ainda.'}
    >
      {students.map((student) => {
        const photoUserId = canSeePhotoOf(student.id) ? student.id : undefined;
        return (
          <MemberCard
            key={student.id}
            name={student.nome}
            photoUserId={photoUserId}
            onSelect={() => onSelect({ kind: 'student', student, photoUserId })}
          />
        );
      })}
    </MemberSection>
  );
}

function TutorsSection({ members, query, onSelect }: MembersListProps) {
  const tutors = members.tutors.filter((tutor) => matchesName(tutor.nome, query));
  return (
    <MemberSection
      title="Professores"
      count={tutors.length}
      emptyMessage={notFoundMessage(query) ?? 'Nenhum professor nesta turma.'}
    >
      {tutors.map((tutor) => (
        <MemberCard
          key={tutor.id}
          name={tutor.nome}
          photoUserId={tutor.id}
          badge={tutor.responsavel ? 'Responsável' : undefined}
          onSelect={() => onSelect({ kind: 'tutor', tutor })}
        />
      ))}
    </MemberSection>
  );
}

function RoomMembers({ roomId }: { roomId: string }) {
  const { user } = useAuth();
  const isProfessor = user?.tipo === 'PROFESSOR';
  const { members, error } = useRoomMembers(roomId, isProfessor);
  const canSeePhotoOf = (userId: string) => isProfessor || userId === user?.id;
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<SelectedMember | null>(null);

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <RoomProblemsHeader
        room={members ? { nome: members.roomName } : null}
        user={user}
        backTo={`${ROUTES.rooms}/${roomId}/problemas`}
        backLabel="Voltar para a turma"
      />
      <main className={cn(PAGE_CONTAINER_CLASS, 'mt-6 flex flex-col gap-6')}>
        <SearchField label="Buscar por nome" value={query} onChange={setQuery} />
        {error && <Alert tone="error">{error.message}</Alert>}
        {!error && !members && <Spinner className="mx-auto mt-10 size-8 text-brand-900" />}
        {members && (
          <>
            <StudentsSection {...{ members, query, canSeePhotoOf }} onSelect={setSelected} />
            <TutorsSection {...{ members, query, canSeePhotoOf }} onSelect={setSelected} />
          </>
        )}
      </main>
      <MemberDetailsSheet member={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

// Tutors and enrolled students share this screen; the API decides what each one can list.
export default function RoomMembersPage() {
  const { id = '' } = useParams<{ id: string }>();
  return <RoomMembers roomId={id} />;
}
