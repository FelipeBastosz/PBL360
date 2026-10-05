import { useDataUrl } from '@/hooks/useDataUrl';
import { useUserPhoto } from '@/hooks/useUserPhoto';
import type { RollCallStudent } from '@/types/session';
import { cn } from '@/utils/cn';

const PALETTE = [
  'bg-[#2a2fa3]',
  'bg-[#0fb5a6]',
  'bg-[#5458e6]',
  'bg-[#137a85]',
  'bg-[#7a3fe0]',
  'bg-[#b8336a]',
];

function colorFor(id: string): string {
  const sum = [...id].reduce((total, char) => total + char.charCodeAt(0), 0);
  return PALETTE[sum % PALETTE.length]!;
}

type StudentAvatarProps = {
  student: Pick<RollCallStudent, 'alunoId' | 'iniciais'>;
  className?: string;
};

export function StudentAvatar({ student, className }: StudentAvatarProps) {
  const photo = useUserPhoto(student.alunoId, true);
  const url = useDataUrl(photo);

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white select-none',
        colorFor(student.alunoId),
        className,
      )}
    >
      {url ? (
        <img src={url} alt="" draggable={false} className="size-full object-cover" />
      ) : (
        <span aria-hidden>{student.iniciais}</span>
      )}
    </span>
  );
}
