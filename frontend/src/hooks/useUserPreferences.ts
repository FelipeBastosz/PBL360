import { useContext } from 'react';
import { PreferencesContext } from '@/contexts/preferencesContext';

export function useUserPreferences() {
  return useContext(PreferencesContext);
}
