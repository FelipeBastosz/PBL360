import { useEffect, useState } from 'react';
import { userService } from '@/services/user.service';

// Photos are shared across every avatar of the same user (headers, side menu, lists),
// so a remount shows the photo at once instead of refetching it.
const loadedPhotos = new Map<string, Blob>();
const pendingPhotos = new Map<string, Promise<Blob>>();
const userVersions = new Map<string, number>();
const listeners = new Set<() => void>();
let cacheGeneration = 0;

function bumpUserVersion(userId: string) {
  userVersions.set(userId, (userVersions.get(userId) ?? 0) + 1);
}

function getUserVersion(userId: string): number {
  return userVersions.get(userId) ?? 0;
}

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export function clearUserPhotoCache(userId?: string) {
  if (userId) {
    loadedPhotos.delete(userId);
    pendingPhotos.delete(userId);
    bumpUserVersion(userId);
  } else {
    loadedPhotos.clear();
    pendingPhotos.clear();
    userVersions.clear();
    cacheGeneration += 1;
  }
  notifyListeners();
}

export function setUserPhotoCache(userId: string, blob: Blob | null) {
  if (blob) {
    loadedPhotos.set(userId, blob);
  } else {
    loadedPhotos.delete(userId);
  }
  pendingPhotos.delete(userId);
  bumpUserVersion(userId);
  notifyListeners();
}

function isCurrentRequest(userId: string, generation: number, version: number): boolean {
  return generation === cacheGeneration && getUserVersion(userId) === version;
}

function loadPhoto(userId: string): Promise<Blob> | null {
  const pending = pendingPhotos.get(userId);
  if (pending) return pending;

  const request = userService.getPhoto(userId);
  if (!request || typeof request.then !== 'function') return null;

  const generation = cacheGeneration;
  const version = getUserVersion(userId);
  const tracked = request
    .then((blob) => {
      if (isCurrentRequest(userId, generation, version)) {
        loadedPhotos.set(userId, blob);
        notifyListeners();
      }
      return blob;
    })
    .finally(() => {
      if (pendingPhotos.get(userId) === tracked) pendingPhotos.delete(userId);
    });
  pendingPhotos.set(userId, tracked);
  return tracked;
}

export function useUserPhoto(userId: string | undefined, hasPhoto: boolean): Blob | null {
  const [, setRevision] = useState(0);
  const versionKey = userId ? `${cacheGeneration}:${getUserVersion(userId)}` : '';

  useEffect(() => {
    const onChange = () => setRevision((r) => r + 1);
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);

  useEffect(() => {
    if (!userId || !hasPhoto || loadedPhotos.has(userId)) return;
    loadPhoto(userId)?.catch(() => undefined);
  }, [userId, hasPhoto, versionKey]);

  if (!userId || !hasPhoto) return null;
  return loadedPhotos.get(userId) ?? null;
}
