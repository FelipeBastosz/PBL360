import { useEffect, useState } from 'react';
import { userService } from '@/services/user.service';

type LoadedPhoto = { userId: string; blob: Blob };

// Photos are shared across every avatar of the same user (headers, side menu, lists),
// so a remount shows the photo at once instead of refetching it.
const loadedPhotos = new Map<string, Blob>();
const pendingPhotos = new Map<string, Promise<Blob>>();

export function clearUserPhotoCache(userId?: string) {
  if (userId) {
    loadedPhotos.delete(userId);
    pendingPhotos.delete(userId);
  } else {
    loadedPhotos.clear();
    pendingPhotos.clear();
  }
}

export function setUserPhotoCache(userId: string, blob: Blob | null) {
  if (blob) {
    loadedPhotos.set(userId, blob);
  } else {
    loadedPhotos.delete(userId);
  }
  pendingPhotos.delete(userId);
}

function loadPhoto(userId: string): Promise<Blob> | null {
  const pending = pendingPhotos.get(userId);
  if (pending) return pending;

  const request = userService.getPhoto(userId);
  if (!request || typeof request.then !== 'function') return null;

  const tracked = request
    .then((blob) => {
      loadedPhotos.set(userId, blob);
      return blob;
    })
    .finally(() => pendingPhotos.delete(userId));
  pendingPhotos.set(userId, tracked);
  return tracked;
}

export function useUserPhoto(userId: string | undefined, hasPhoto: boolean): Blob | null {
  const [photo, setPhoto] = useState<LoadedPhoto | null>(null);
  const cached = userId && hasPhoto ? loadedPhotos.get(userId) : undefined;

  useEffect(() => {
    if (!userId || !hasPhoto || loadedPhotos.has(userId)) return undefined;
    let active = true;
    const photoPromise = loadPhoto(userId);
    if (!photoPromise) return undefined;

    photoPromise
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

  if (cached) return cached;
  if (!hasPhoto || !photo || photo.userId !== userId) return null;
  return photo.blob;
}
