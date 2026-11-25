import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import { conversationService } from './conversation.service';

const originalAdapter = api.defaults.adapter;

function respondWith(data: unknown, status = 200) {
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

const conversation = {
  id: 'conv-1',
  interlocutor: { id: 'student-1', nome: 'Ana Souza', tipo: 'ALUNO', possuiFoto: false },
};

const message = {
  id: 'msg-1',
  remetente: { id: 'student-1', nome: 'Ana Souza' },
  texto: 'Olá, professora!',
  enviadaEm: '2026-11-16T10:00:00.000Z',
};

describe('conversationService', () => {
  it('lists the conversations of the authenticated user in a room', async () => {
    const adapter = respondWith([conversation]);

    await expect(conversationService.listForRoom('room-1')).resolves.toEqual([conversation]);
    expect(sentRequest(adapter)).toMatchObject({ method: 'get', url: '/salas/room-1/conversas' });
  });

  it('opens a conversation with the recipient of the room', async () => {
    const adapter = respondWith(conversation, 201);

    await conversationService.open('room-1', { destinatarioId: 'student-1' });

    const request = sentRequest(adapter);
    expect(request).toMatchObject({ method: 'post', url: '/salas/room-1/conversas' });
    expect(JSON.parse(request.data as string)).toEqual({ destinatarioId: 'student-1' });
  });

  it('lists the messages of a conversation forwarding the pagination params', async () => {
    const page = { itens: [message], proximoCursor: null };
    const adapter = respondWith(page);

    await expect(conversationService.listMessages('conv-1', { apos: 'msg-0' })).resolves.toEqual(
      page,
    );
    expect(sentRequest(adapter)).toMatchObject({
      method: 'get',
      url: '/conversas/conv-1/mensagens',
      params: { apos: 'msg-0' },
    });
  });

  it('sends a message to a conversation', async () => {
    const adapter = respondWith(message, 201);

    await expect(conversationService.send('conv-1', { texto: 'Olá' })).resolves.toEqual(message);
    const request = sentRequest(adapter);
    expect(request).toMatchObject({ method: 'post', url: '/conversas/conv-1/mensagens' });
    expect(JSON.parse(request.data as string)).toEqual({ texto: 'Olá' });
  });
});
