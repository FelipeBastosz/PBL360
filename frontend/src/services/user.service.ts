import { api } from './api';

const BASE = '/usuarios';

export const userService = {
  getPhoto: (userId: string) =>
    api.get<Blob>(`${BASE}/${userId}/foto`, { responseType: 'blob' }).then((r) => r.data),
};
