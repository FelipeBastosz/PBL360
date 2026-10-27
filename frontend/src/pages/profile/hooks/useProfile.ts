import { useCallback, useEffect, useState } from 'react';
import { userService } from '@/services/user.service';
import type { UserProfileResponse } from '@/types/user';
import { useProfileActions } from './useProfileActions';

export function useProfile() {
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await userService.getProfile();
      setProfile(data);
    } catch {
      setError('Não foi possível carregar as informações do seu perfil.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    userService
      .getProfile()
      .then((data) => {
        if (active) {
          setProfile(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError('Não foi possível carregar as informações do seu perfil.');
          setIsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

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
