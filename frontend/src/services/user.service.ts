import type { TutorSummary } from '@/types/room';
import type { UpdateUserProfilePayload, UserProfileResponse } from '@/types/user';
import { api } from './api';

const BASE = '/usuarios';

import { mockUserService } from './mocks/user.mock';

export const userService = {
  getProfile: () =>
    api
      .get<UserProfileResponse>(`${BASE}/meu-perfil`)
      .then((r) => r.data)
      .catch(() => mockUserService.getProfile()),

  updateProfile: (payload: UpdateUserProfilePayload) =>
    api
      .patch<UserProfileResponse>(`${BASE}/meu-perfil`, payload)
      .then((r) => r.data)
      .catch(() => mockUserService.updateProfile(payload)),

  uploadPhoto: (file: File) => {
    const formData = new FormData();
    formData.append('foto', file);
    return api
      .put<void>(`${BASE}/minha-foto`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
      .catch(() => mockUserService.uploadPhoto(file));
  },

  deletePhoto: () =>
    api
      .delete<void>(`${BASE}/minha-foto`)
      .then((r) => r.data)
      .catch(() => mockUserService.deletePhoto()),

  getPhoto: (userId: string) =>
    api
      .get<Blob>(`${BASE}/${userId}/foto`, { responseType: 'blob' })
      .then((r) => r.data)
      .catch(() => mockUserService.getPhoto(userId)),

  searchTutors: (busca: string) =>
    api.get<TutorSummary[]>(`${BASE}/professores`, { params: { busca } }).then((r) => r.data),
};
