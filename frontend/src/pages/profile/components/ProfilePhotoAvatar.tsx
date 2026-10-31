import { CameraIcon, UserIcon } from '@heroicons/react/24/outline';
import { Spinner } from '@/components/ui/Spinner';
import { useUserPhoto } from '@/hooks/useUserPhoto';
import { useDataUrl } from '@/hooks/useDataUrl';
import { getInitials } from '@/utils/initials';
import type { UserProfileResponse } from '@/types/user';

interface ProfilePhotoAvatarProps {
  profile: UserProfileResponse;
  isBusy: boolean;
  onPickPhoto?: () => void;
}

export function ProfilePhotoAvatar({ profile, isBusy, onPickPhoto }: ProfilePhotoAvatarProps) {
  const photoBlob = useUserPhoto(profile.id, profile.possuiFoto);
  const photoUrl = useDataUrl(photoBlob);

  return (
    <div className="relative inline-block">
      <div className="relative flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-brand-900 bg-brand-100 text-2xl font-bold text-brand-900">
        {photoUrl ? (
          <img src={photoUrl} alt={`Foto de ${profile.nome}`} className="size-full object-cover" />
        ) : profile.nome ? (
          <span>{getInitials(profile.nome)}</span>
        ) : (
          <UserIcon className="size-16 text-brand-900" strokeWidth={1.4} aria-hidden />
        )}

        {isBusy && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white backdrop-blur-[1px]">
            <Spinner className="size-6 text-white" />
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onPickPhoto}
        disabled={isBusy}
        title={profile.possuiFoto ? 'Alterar foto de perfil' : 'Adicionar foto de perfil'}
        aria-label={profile.possuiFoto ? 'Trocar foto de perfil' : 'Adicionar foto de perfil'}
        className="absolute right-0 bottom-0 flex size-9 items-center justify-center rounded-full bg-brand-900 text-white ring-4 ring-white transition-transform duration-200 hover:scale-110 active:scale-95 focus-visible:outline-2 focus-visible:outline-brand-900 disabled:cursor-not-allowed"
      >
        <CameraIcon className="size-5" strokeWidth={1.8} aria-hidden />
      </button>
    </div>
  );
}
