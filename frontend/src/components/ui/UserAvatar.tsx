import { useDataUrl } from '@/hooks/useDataUrl';
import { useUserPhoto } from '@/hooks/useUserPhoto';
import type { UserResponse } from '@/types/auth';
import { cn } from '@/utils/cn';
import { getInitials } from '@/utils/initials';

type UserAvatarProps = {
  user: Pick<UserResponse, 'id' | 'nome' | 'possuiFoto'> | null;
  className?: string;
};

export function UserAvatar({ user, className }: UserAvatarProps) {
  const photo = useUserPhoto(user?.id, Boolean(user?.possuiFoto));
  const url = useDataUrl(photo);

  return (
    <div
      className={cn(
        'flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-200 text-sm font-semibold text-brand-900',
        className,
      )}
    >
      {url ? (
        <img
          src={url}
          alt={`Foto de ${user?.nome ?? 'usuário'}`}
          className="size-full object-cover"
        />
      ) : (
        <span aria-hidden>{getInitials(user?.nome)}</span>
      )}
    </div>
  );
}
