import { useDataUrl } from '@/hooks/useDataUrl';
import { useUserPhoto } from '@/hooks/useUserPhoto';
import { cn } from '@/utils/cn';
import { getInitials } from '@/utils/initials';
import { avatarColor } from '@/utils/members';

type MemberAvatarProps = {
  name: string;
  // Students come without an id from the API, so only tutors can show a photo.
  photoUserId?: string;
  className?: string;
};

export function MemberAvatar({ name, photoUserId, className }: MemberAvatarProps) {
  const photo = useUserPhoto(photoUserId, Boolean(photoUserId));
  const url = useDataUrl(photo);

  return (
    <span
      aria-hidden
      style={{ backgroundColor: avatarColor(name) }}
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white',
        className,
      )}
    >
      {url ? <img src={url} alt="" className="size-full object-cover" /> : getInitials(name)}
    </span>
  );
}
