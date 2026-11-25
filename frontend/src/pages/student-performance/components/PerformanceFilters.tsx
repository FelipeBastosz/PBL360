import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { MemberAvatar } from '@/pages/rooms/members/MemberAvatar';
import type { Problem } from '@/types/problem';
import type { RoomStudent } from '@/types/room';
import { cn } from '@/utils/cn';

type StudentPickerProps = {
  students: RoomStudent[] | null;
  studentId: string;
  studentName: string;
  onChange: (studentId: string) => void;
};

// The native select stays on top of the card, so phones open their own picker.
export function StudentPicker({ students, studentId, studentName, onChange }: StudentPickerProps) {
  const options = students ?? [{ id: studentId, nome: studentName }];
  return (
    <label className="relative flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-3 shadow-[0_1px_2px_rgb(16_33_76/0.06)] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-900">
      <MemberAvatar
        name={studentName || '?'}
        photoUserId={studentId}
        className="size-11 text-base"
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-xs font-semibold text-muted">Aluno</span>
        <span className="truncate text-base font-bold text-ink">{studentName || '…'}</span>
      </span>
      <span aria-hidden className="flex items-center gap-1 text-sm font-semibold text-brand-900">
        Trocar
        <ChevronDownIcon className="size-4" />
      </span>
      <select
        aria-label="Trocar aluno"
        value={studentId}
        onChange={(event) => onChange(event.target.value)}
        className="absolute inset-0 size-full cursor-pointer opacity-0"
      >
        {options.map((student) => (
          <option key={student.id} value={student.id}>
            {student.nome}
          </option>
        ))}
      </select>
    </label>
  );
}

type ProblemFilterProps = {
  problems: Problem[] | null;
  selectedId: string | null;
  onChange: (problemId: string | null) => void;
};

const CHIP_CLASS =
  'h-10 shrink-0 rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-900';

function FilterChip(props: { label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={props.isActive}
      onClick={props.onClick}
      className={cn(
        CHIP_CLASS,
        props.isActive
          ? 'border-brand-900 bg-brand-900 text-white'
          : 'border-black/10 bg-white text-ink hover:border-brand-300',
      )}
    >
      {props.label}
    </button>
  );
}

// The row scrolls sideways without a scrollbar; the faded edge shows there is more to see.
export function ProblemFilter({ problems, selectedId, onChange }: ProblemFilterProps) {
  return (
    <div
      role="group"
      aria-label="Filtrar por problema"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pt-0.5 pr-10 pb-1 [mask-image:linear-gradient(90deg,#000_calc(100%-28px),transparent)] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 sm:[mask-image:none] [&::-webkit-scrollbar]:hidden"
    >
      <FilterChip label="Todos" isActive={selectedId === null} onClick={() => onChange(null)} />
      {(problems ?? []).map((problem) => (
        <FilterChip
          key={problem.id}
          label={problem.titulo}
          isActive={selectedId === problem.id}
          onClick={() => onChange(problem.id)}
        />
      ))}
    </div>
  );
}
