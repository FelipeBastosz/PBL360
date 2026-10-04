import type { AxiosAdapter, AxiosResponse } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import { userService } from './user.service';

const originalAdapter = api.defaults.adapter;

afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

describe('userService', () => {
  it('searches tutors by name or e-mail', async () => {
    const tutors = [{ id: 'tutor-2', nome: 'Carlos', email: 'carlos@uefs.br' }];
    const adapter = vi.fn<AxiosAdapter>(async (config) => {
      return { status: 200, data: tutors, statusText: '', headers: {}, config } as AxiosResponse;
    });
    api.defaults.adapter = adapter;

    await expect(userService.searchTutors('carl')).resolves.toEqual(tutors);
    expect(adapter.mock.calls[0][0]).toMatchObject({
      method: 'get',
      url: '/usuarios/professores',
      params: { busca: 'carl' },
    });
  });

  it('downloads the photo of a user as a blob', async () => {
    const photo = new Blob(['png'], { type: 'image/png' });
    const adapter = vi.fn<AxiosAdapter>(async (config) => {
      return { status: 200, data: photo, statusText: '', headers: {}, config } as AxiosResponse;
    });
    api.defaults.adapter = adapter;

    await expect(userService.getPhoto('user-1')).resolves.toBe(photo);
    expect(adapter.mock.calls[0][0]).toMatchObject({
      method: 'get',
      url: '/usuarios/user-1/foto',
      responseType: 'blob',
    });
  });
});
