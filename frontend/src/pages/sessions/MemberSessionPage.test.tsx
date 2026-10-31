import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/services/apiError';
import { problemService } from '@/services/problem.service';
import { sessionService } from '@/services/session.service';
import { sessionStore } from '@/services/sessionStore';
import { userService } from '@/services/user.service';
import { renderApp, sessionFor, studentUser } from '@/testing/renderApp';
import type { MemberSession } from '@/types/session';

vi.mock('@/services/problem.service', () => ({
  problemService: { getById: vi.fn() },
}));

vi.mock('@/services/session.service', () => ({
  sessionService: {
    getById: vi.fn(),
    getForMember: vi.fn(),
    listAttachments: vi.fn().mockResolvedValue([]),
    getReleases: vi.fn(),
  },
}));

vi.mock('@/services/user.service');

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: vi.fn() }),
}));

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
  vi.mocked(sessionService.getById).mockResolvedValue(session);
  vi.mocked(sessionService.getReleases).mockResolvedValue({
    autoavaliacao: { liberada: false, prazo: null, enviadas: 0, esperadas: 10 },
    pares: { liberada: false, prazo: null, enviadas: 0, esperadas: 10 },
    atualizadoEm: '2026-08-12',
    atualizadoPor: 'tutor-1',
  });
  vi.mocked(problemService.getById).mockResolvedValue({
    id: 'p1',
    salaId: 'r1',
    titulo: 'Problema 1',
    descricao: null,
    ordem: 1,
    dataInicio: null,
    dataFim: null,
    tabelaId: null,
    autoavaliacaoLiberada: false,
    avaliacaoEntreParesLiberada: false,
    liberadoEm: null,
    prazoAutoavaliacao: null,
    criadoPor: 'tutor-1',
    criadoEm: '2026-08-12',
    atualizadoEm: '2026-08-12',
  });
  sessionStore.save(sessionFor(user));
  return renderApp('/sessoes/s1');
}

describe('MemberSessionPage', () => {
  beforeAll(async () => {
    await import('./MemberSessionPage');
    await import('./SessionHubPage');
  });

  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
    localStorage.clear();
  });

  it('sends a student to the session screen inside the room and problem', async () => {
    openAs();

    expect(
      await screen.findByRole('heading', { name: 'Anexos da Sessão' }, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /voltar para as sessões/i })).toHaveAttribute(
      'href',
      '/turmas/r1/problemas/p1',
    );
  });

  it('explains when the student cannot open the session', async () => {
    openAs(studentUser, false);

    expect(await screen.findByText('Você não participa desta sala.')).toBeInTheDocument();
  });
});
