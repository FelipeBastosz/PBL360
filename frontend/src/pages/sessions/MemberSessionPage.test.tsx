import { screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/services/apiError';
import { sessionService } from '@/services/session.service';
import { sessionStore } from '@/services/sessionStore';
import { userService } from '@/services/user.service';
import { renderApp, sessionFor, studentUser } from '@/testing/renderApp';
import type { MemberSession } from '@/types/session';

vi.mock('@/services/session.service');
vi.mock('@/services/user.service');

const session: MemberSession = {
  id: 's1',
  titulo: 'Sessão',
  descricao: null,
  data: '2026-08-12',
  ordem: 1,
  status: 'agendada',
  problemaId: 'p1',
  salaId: 'r1',
  problemaTitulo: 'Problema 1',
};

function openAs(user = studentUser, found: boolean = true) {
  vi.mocked(userService.getPhoto).mockRejectedValue(new ApiError(404, ['sem foto']));
  if (found) vi.mocked(sessionService.getForMember).mockResolvedValue(session);
  else
    vi.mocked(sessionService.getForMember).mockRejectedValue(
      new ApiError(403, ['Você não participa desta sala.']),
    );
  vi.mocked(sessionService.listAttachments).mockResolvedValue([]);
  sessionStore.save(sessionFor(user));
  return renderApp('/sessoes/s1');
}

describe('MemberSessionPage', () => {
  beforeAll(async () => {
    await import('./MemberSessionPage');
  });

  afterEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  it('shows the session with its attachments and the upload button to a student', async () => {
    openAs();

    expect(await screen.findByRole('heading', { name: 'Sessão · 12 ago' })).toBeInTheDocument();
    expect(screen.getByText('Problema 1')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Anexos da Sessão' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Adicionar Documento/ })).toBeInTheDocument();
  });

  it('explains when the student cannot open the session', async () => {
    openAs(studentUser, false);

    expect(await screen.findByText('Você não participa desta sala.')).toBeInTheDocument();
  });

  it('sends a tutor to the tutor session screen', async () => {
    vi.mocked(sessionService.getById).mockResolvedValue(session);
    openAs({ ...studentUser, tipo: 'PROFESSOR', email: 'carlos@uefs.br' });

    expect(await screen.findByRole('link', { name: /chamada/i })).toHaveAttribute(
      'href',
      '/turmas/r1/problemas/p1/sessoes/s1/chamada',
    );
  });
});
