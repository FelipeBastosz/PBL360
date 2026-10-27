import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { sessionStore } from '@/services/sessionStore';
import { userService } from '@/services/user.service';
import type { UserProfileResponse } from '@/types/user';
import { useProfilePhotoActions } from './useProfilePhotoActions';

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { message?: string | string[] } } }).response;
    const msg = res?.data?.message;
    if (Array.isArray(msg)) return msg[0] ?? fallback;
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

export function useProfileActions(
  profile: UserProfileResponse | null,
  setProfile: React.Dispatch<React.SetStateAction<UserProfileResponse | null>>,
  setActionError: (msg: string | null) => void,
  setSuccessMessage: (msg: string | null) => void,
) {
  const { user, updateUser } = useAuth();
  const photoActions = useProfilePhotoActions(
    profile,
    setProfile,
    setActionError,
    setSuccessMessage,
  );

  const saveName = useCallback(
    async (newName: string): Promise<boolean> => {
      setActionError(null);
      setSuccessMessage(null);
      try {
        const updated = await userService.updateProfile({ nome: newName });
        setProfile(updated);
        if (user) sessionStore.saveUser({ ...user, nome: updated.nome });
        updateUser?.({ nome: updated.nome });
        setSuccessMessage('Nome atualizado com sucesso.');
        return true;
      } catch (err) {
        setActionError(getErrorMessage(err, 'Erro ao atualizar o nome.'));
        return false;
      }
    },
    [user, setProfile, updateUser, setActionError, setSuccessMessage],
  );

  return { saveName, ...photoActions };
}
