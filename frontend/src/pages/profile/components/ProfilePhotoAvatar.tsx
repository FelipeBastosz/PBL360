import { UserIcon } from '@heroicons/react/24/outline';
import { Spinner } from '@/components/ui/Spinner';
import { useUserPhoto } from '@/hooks/useUserPhoto';
import { useDataUrl } from '@/hooks/useDataUrl';
import { getInitials } from '@/utils/initials';
import type { UserProfileResponse } from '@/types/user';

interface ProfilePhotoAvatarProps {
  profile: UserProfileResponse;
  isBusy: boolean;
}

export function ProfilePhotoAvatar({ profile, isBusy }: ProfilePhotoAvatarProps) {
  const photoBlob = useUserPhoto(profile.id, profile.possuiFoto);
  const photoUrl = useDataUrl(photoBlob);

  return (
    <div className="relative flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-2xl font-bold text-brand-900 ring-4 ring-brand-900/10">
      {photoUrl ? (
        <img src={photoUrl} alt={`Foto de ${profile.nome}`} className="size-full object-cover" />
      ) : profile.nome ? (
        <span>{getInitials(profile.nome)}</span>
      ) : (
        <UserIcon className="size-12 text-brand-400" aria-hidden />
      )}

      {isBusy && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white backdrop-blur-[1px]">
          <Spinner className="size-6 text-white" />
        </div>
      )}
    </div>
  );
}
