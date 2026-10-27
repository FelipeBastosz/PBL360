import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { clearUserPhotoCache } from '@/hooks/useUserPhoto';
import { sessionStore } from '@/services/sessionStore';
import { userService } from '@/services/user.service';
import type { UserProfileResponse } from '@/types/user';

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { message?: string | string[] } } }).response;
    const msg = res?.data?.message;
    if (Array.isArray(msg)) return msg[0] ?? fallback;
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

export function useProfilePhotoActions(
  profile: UserProfileResponse | null,
  setProfile: React.Dispatch<React.SetStateAction<UserProfileResponse | null>>,
  setActionError: (msg: string | null) => void,
  setSuccessMessage: (msg: string | null) => void,
) {
  const { user, updateUser } = useAuth();

  const uploadPhoto = useCallback(
    async (file: File): Promise<boolean> => {
      setActionError(null);
      setSuccessMessage(null);
      try {
        await userService.uploadPhoto(file);
        if (profile) {
          clearUserPhotoCache(profile.id);
          setProfile((prev) => (prev ? { ...prev, possuiFoto: true } : null));
          if (user) sessionStore.saveUser({ ...user, possuiFoto: true });
          updateUser?.({ possuiFoto: true });
        }
        setSuccessMessage('Foto atualizada com sucesso.');
        return true;
      } catch (err) {
        setActionError(getErrorMessage(err, 'Erro ao enviar a nova foto.'));
        return false;
      }
    },
    [user, profile, setProfile, updateUser, setActionError, setSuccessMessage],
  );

  const deletePhoto = useCallback(async (): Promise<boolean> => {
    setActionError(null);
    setSuccessMessage(null);
    try {
      await userService.deletePhoto();
      if (profile) {
        clearUserPhotoCache(profile.id);
        setProfile((prev) => (prev ? { ...prev, possuiFoto: false } : null));
        if (user) sessionStore.saveUser({ ...user, possuiFoto: false });
        updateUser?.({ possuiFoto: false });
      }
      setSuccessMessage('Foto removida com sucesso.');
      return true;
    } catch {
      setActionError('Erro ao remover a foto.');
      return false;
    }
  }, [user, profile, setProfile, updateUser, setActionError, setSuccessMessage]);

  return { uploadPhoto, deletePhoto };
}
