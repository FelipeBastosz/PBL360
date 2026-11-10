import type { TutorSummary } from '@/types/room';
import type {
  ChangePasswordPayload,
  UpdateUserProfilePayload,
  UserProfileResponse,
} from '@/types/user';
import { api } from './api';

const BASE = '/usuarios';

export const userService = {
  getProfile: () => api.get<UserProfileResponse>(`${BASE}/meu-perfil`).then((r) => r.data),

  updateProfile: (payload: UpdateUserProfilePayload) =>
    api.patch<UserProfileResponse>(`${BASE}/meu-perfil`, payload).then((r) => r.data),

  uploadPhoto: (file: File) => {
    const formData = new FormData();
    formData.append('foto', file);
    return api
      .put<void>(`${BASE}/minha-foto`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  deletePhoto: () => api.delete<void>(`${BASE}/minha-foto`).then((r) => r.data),

  changePassword: (payload: ChangePasswordPayload) =>
    api.patch<void>(`${BASE}/minha-senha`, payload).then((r) => r.data),

  getPhoto: (userId: string) =>
    api.get<Blob>(`${BASE}/${userId}/foto`, { responseType: 'blob' }).then((r) => r.data),

  searchTutors: (busca: string) =>
    api.get<TutorSummary[]>(`${BASE}/professores`, { params: { busca } }).then((r) => r.data),
};
