import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import { roomService } from './room.service';

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

const room = {
  id: 'room-1',
  professorResponsavelId: 'tutor-1',
  nome: 'Engenharia de Software',
  codigoDisciplina: 'EXA123',
  codigoSala: 'aB7kP2x9',
  semestre: '2026.2',
  ativo: true,
  criadoEm: '2026-09-01T10:00:00.000Z',
};

describe('roomService', () => {
  it('lists the rooms of the authenticated tutor', async () => {
    const adapter = respondWith([room]);

    await expect(roomService.list()).resolves.toEqual([room]);
    expect(sentRequest(adapter)).toMatchObject({ method: 'get', url: '/salas' });
  });

  it('fetches one room by id', async () => {
    const adapter = respondWith(room);

    await expect(roomService.getById('room-1')).resolves.toEqual(room);
    expect(sentRequest(adapter)).toMatchObject({ method: 'get', url: '/salas/room-1' });
  });

  it('creates a room without sending the tutor, who comes from the session', async () => {
    const adapter = respondWith(room, 201);
    const payload = {
      nome: 'Engenharia de Software',
      codigoDisciplina: 'EXA123',
      semestre: '2026.2',
    };

    await expect(roomService.create(payload)).resolves.toEqual(room);
    expect(sentRequest(adapter)).toMatchObject({ method: 'post', url: '/salas' });
    expect(JSON.parse(sentRequest(adapter).data as string)).toEqual(payload);
  });

  it('updates only the informed fields and returns the room', async () => {
    const adapter = respondWith({ ...room, ativo: false });

    await expect(roomService.update('room-1', { ativo: false })).resolves.toMatchObject({
      ativo: false,
    });
    expect(sentRequest(adapter)).toMatchObject({ method: 'patch', url: '/salas/room-1' });
    expect(JSON.parse(sentRequest(adapter).data as string)).toEqual({ ativo: false });
  });

  it('deletes a room without a body', async () => {
    const adapter = respondWith(undefined, 204);

    await expect(roomService.remove('room-1')).resolves.toBeUndefined();
    expect(sentRequest(adapter)).toMatchObject({ method: 'delete', url: '/salas/room-1' });
    expect(sentRequest(adapter).data).toBeUndefined();
  });

  it('links and unlinks tutors', async () => {
    const adapter = respondWith({ mensagem: 'ok' });

    await roomService.addTutor('room-1', { professorId: 'tutor-2' });
    await roomService.removeTutor('room-1', 'tutor-2');

    expect(adapter.mock.calls[0][0]).toMatchObject({
      method: 'post',
      url: '/salas/room-1/professores',
    });
    expect(JSON.parse(adapter.mock.calls[0][0].data as string)).toEqual({ professorId: 'tutor-2' });
    expect(adapter.mock.calls[1][0]).toMatchObject({
      method: 'delete',
      url: '/salas/room-1/professores/tutor-2',
    });
  });

  it('lists the rooms of the authenticated student', async () => {
    const studentRooms = [
      { salaId: 'room-1', nome: 'Engenharia de Software', semestre: '2026.2', totalAlunos: 30 },
    ];
    const adapter = respondWith(studentRooms);

    await expect(roomService.listMyRooms()).resolves.toEqual(studentRooms);
    expect(sentRequest(adapter)).toMatchObject({ method: 'get', url: '/salas/minhas' });
  });

  it('joins a room using an invite code', async () => {
    const adapter = respondWith({ mensagem: 'Entrada na sala realizada com sucesso.' });
    const payload = { codigo: 'aB7kP2x9' };

    await expect(roomService.join(payload)).resolves.toEqual({
      mensagem: 'Entrada na sala realizada com sucesso.',
    });
    expect(sentRequest(adapter)).toMatchObject({ method: 'post', url: '/salas/entrar' });
    expect(JSON.parse(sentRequest(adapter).data as string)).toEqual(payload);
  });

  it('lists students enrolled in a room', async () => {
    const students = [
      { id: 'student-1', nome: 'Aluno Um', dataEntrada: '2026-09-01T10:00:00.000Z' },
    ];
    const adapter = respondWith(students);

    await expect(roomService.listStudents('room-1')).resolves.toEqual(students);
    expect(sentRequest(adapter)).toMatchObject({ method: 'get', url: '/salas/room-1/alunos' });
  });
});
