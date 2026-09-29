import { useEffect, useState } from 'react';
import { userService } from '@/services/user.service';

type LoadedPhoto = { userId: string; blob: Blob };

export function useUserPhoto(userId: string | undefined, hasPhoto: boolean): Blob | null {
  const [photo, setPhoto] = useState<LoadedPhoto | null>(null);

  useEffect(() => {
    if (!userId || !hasPhoto) return undefined;
    let active = true;
    userService
      .getPhoto(userId)
      .then((blob) => {
        if (active) setPhoto({ userId, blob });
      })
      .catch(() => {
        if (active) setPhoto(null);
      });
    return () => {
      active = false;
    };
  }, [userId, hasPhoto]);

  if (!hasPhoto || !photo || photo.userId !== userId) return null;
  return photo.blob;
}
