import type { UpdateUserPreferencesPayload, UserPreferences } from '@/types/preferences';
import { api } from './api';

const PREFERENCES_PATH = '/usuarios/minhas-preferencias';

export const preferencesService = {
  getMyPreferences: () => api.get<UserPreferences>(PREFERENCES_PATH).then((r) => r.data),

  updateMyPreferences: (payload: UpdateUserPreferencesPayload) =>
    api.put<UserPreferences>(PREFERENCES_PATH, payload).then((r) => r.data),
};
