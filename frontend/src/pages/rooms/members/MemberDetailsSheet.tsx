import { Link } from 'react-router-dom';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { Sheet } from '@/components/ui/Sheet';
import type { RoomStudent, RoomTutor } from '@/types/room';
import { formatDate } from '@/utils/date';
import { MemberAvatar } from './MemberAvatar';

export type SelectedMember =
  | { kind: 'student'; student: RoomStudent; photoUserId?: string }
  | { kind: 'tutor'; tutor: RoomTutor };

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 truncate text-right text-ink" title={value}>
        {value}
      </dd>
    </div>
  );
}

function FullName({ name }: { name: string }) {
  return (
    <div className="py-3">
      <dt className="text-muted">Nome completo</dt>
      <dd className="mt-1 text-lg font-semibold text-ink">{name}</dd>
    </div>
  );
}

// Tutors have no performance score, so their popup never shows one.
function MemberDetails({ member }: { member: SelectedMember }) {
  if (member.kind === 'student') {
    return (
      <dl className="divide-y divide-border-subtle">
        <FullName name={member.student.nome} />
        {member.student.matricula && (
          <DetailRow label="Matrícula" value={member.student.matricula} />
        )}
        <DetailRow label="E-mail" value={member.student.email} />
        <DetailRow label="Na turma desde" value={formatDate(member.student.dataEntrada)} />
      </dl>
    );
  }
  return (
    <dl className="divide-y divide-border-subtle">
      <FullName name={member.tutor.nome} />
      <DetailRow label="E-mail" value={member.tutor.email} />
      <DetailRow
        label="Papel"
        value={member.tutor.responsavel ? 'Responsável pela turma' : 'Professor associado'}
      />
    </dl>
  );
}

const memberName = (member: SelectedMember) =>
  member.kind === 'student' ? member.student.nome : member.tutor.nome;

// Tutors carry no photo flag, so their photo is always attempted (as in the invite sheet).
const memberPhotoId = (member: SelectedMember) =>
  member.kind === 'tutor' ? member.tutor.id : member.photoUserId;

type MemberDetailsSheetProps = {
  member: SelectedMember | null;
  onClose: () => void;
  // Only tutors follow a student's grades, so the page sets this just for them.
  performanceHref?: (studentId: string) => string;
};

function PerformanceLink({ href }: { href: string }) {
  return (
    <Link
      to={href}
      className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-900 px-4 text-base font-semibold text-white transition-[background-color,scale] duration-200 hover:bg-brand-700 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-900"
    >
      <ChartBarIcon className="size-5" aria-hidden />
      Ver evolução nas sessões
    </Link>
  );
}

export function MemberDetailsSheet({ member, onClose, performanceHref }: MemberDetailsSheetProps) {
  const title = member?.kind === 'tutor' ? 'Detalhes do Professor' : 'Detalhes do Aluno';

  return (
    <Sheet isOpen={member !== null} placement="center" title={title} onClose={onClose}>
      {member && (
        <div className="flex flex-col items-center gap-2">
          <MemberAvatar
            name={memberName(member)}
            photoUserId={memberPhotoId(member)}
            className="size-20 text-2xl"
          />
          <div className="w-full">
            <MemberDetails member={member} />
          </div>
          {member.kind === 'student' && performanceHref && (
            <PerformanceLink href={performanceHref(member.student.id)} />
          )}
        </div>
      )}
    </Sheet>
  );
}
