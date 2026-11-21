import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services/user.service';
import type { UserProfileResponse } from '@/types/user';
import { useProfileActions } from './useProfileActions';

const PROFILE_LOAD_ERROR = 'Não foi possível carregar as informações do seu perfil.';

export function useProfile() {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const applyProfile = useCallback(
    (data: UserProfileResponse) => {
      setProfile(data);
      updateUser?.({ nome: data.nome, possuiFoto: data.possuiFoto });
    },
    [updateUser],
  );

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      applyProfile(await userService.getProfile());
    } catch {
      setError(PROFILE_LOAD_ERROR);
    } finally {
      setIsLoading(false);
    }
  }, [applyProfile]);

  useEffect(() => {
    let active = true;
    userService
      .getProfile()
      .then((data) => active && applyProfile(data))
      .catch(() => active && setError(PROFILE_LOAD_ERROR))
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, [applyProfile]);

  const actions = useProfileActions(profile, setProfile, setActionError, setSuccessMessage);

  return {
    profile,
    isLoading,
    error,
    actionError,
    successMessage,
    reload: fetchProfile,
    ...actions,
  };
}
