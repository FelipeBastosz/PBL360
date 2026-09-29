import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import { authService } from './auth.service';

const originalAdapter = api.defaults.adapter;

function respondWith(data: unknown, status = 201) {
  const adapter = vi.fn<AxiosAdapter>(async (config) => {
    return { status, data, statusText: '', headers: {}, config } as AxiosResponse;
  });
  api.defaults.adapter = adapter;
  return adapter;
}

function sentRequest(adapter: ReturnType<typeof respondWith>): InternalAxiosRequestConfig {
  return adapter.mock.calls[0][0];
}

afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

describe('authService.register', () => {
  const base = {
    nome: 'Ana Souza',
    email: 'ana@discente.uefs.br',
    senha: 'senha-secreta',
    tipo: 'ALUNO' as const,
  };

  it('sends the registration as multipart form data with the photo file', async () => {
    const adapter = respondWith({ mensagem: 'ok' });
    const foto = new File(['png'], 'ana.png', { type: 'image/png' });

    await authService.register({ ...base, matricula: '20240001', foto });
    const request = sentRequest(adapter);
    const body = request.data as FormData;

    expect(request).toMatchObject({ method: 'post', url: '/autenticacao/registro' });
    expect(body).toBeInstanceOf(FormData);
    expect(body.get('nome')).toBe('Ana Souza');
    expect(body.get('matricula')).toBe('20240001');
    expect(body.get('foto')).toBeInstanceOf(File);
    expect((body.get('foto') as File).name).toBe('ana.png');
  });

  it('leaves out the fields a professor does not fill', async () => {
    const adapter = respondWith({ mensagem: 'ok' });

    await authService.register({ ...base, tipo: 'PROFESSOR', email: 'carlos@uefs.br' });
    const body = sentRequest(adapter).data as FormData;

    expect(body.has('matricula')).toBe(false);
    expect(body.has('foto')).toBe(false);
  });
});
