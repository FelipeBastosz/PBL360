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
import { StudentMembersNotice } from './StudentMembersNotice';
import { type RoomMembers, useRoomMembers } from './useRoomMembers';

type MembersListProps = {
  members: RoomMembers;
  query: string;
  onSelect: (member: SelectedMember) => void;
};

function MembersList({ members, query, onSelect }: MembersListProps) {
  const students = members.students.filter((student) => matchesName(student.nome, query));
  const tutors = members.tutors.filter((tutor) => matchesName(tutor.nome, query));
  const notFound = query.trim() ? 'Ninguém encontrado com esse nome.' : null;

  return (
    <>
      <MemberSection
        title="Alunos"
        count={students.length}
        emptyMessage={notFound ?? 'Nenhum aluno entrou nesta turma ainda.'}
      >
        {students.map((student) => (
          <MemberCard
            key={student.id}
            name={student.nome}
            photoUserId={student.possuiFoto ? student.id : undefined}
            onSelect={() => onSelect({ kind: 'student', student })}
          />
        ))}
      </MemberSection>
      <MemberSection
        title="Professores"
        count={tutors.length}
        emptyMessage={notFound ?? 'Nenhum professor nesta turma.'}
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
    </>
  );
}

function TutorRoomMembers({ roomId }: { roomId: string }) {
  const { user } = useAuth();
  const { members, error } = useRoomMembers(roomId);
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
        {members && <MembersList members={members} query={query} onSelect={setSelected} />}
      </main>
      <MemberDetailsSheet member={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

export default function RoomMembersPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { user } = useAuth();

  if (user?.tipo !== 'PROFESSOR') return <StudentMembersNotice roomId={id} />;
  return <TutorRoomMembers roomId={id} />;
}
