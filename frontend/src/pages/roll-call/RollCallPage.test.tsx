import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/services/apiError';
import { problemService } from '@/services/problem.service';
import { sessionService } from '@/services/session.service';
import { sessionStore } from '@/services/sessionStore';
import { userService } from '@/services/user.service';
import { renderApp, sessionFor } from '@/testing/renderApp';
import type { UserResponse } from '@/types/auth';
import type { RollCall, RollCallStudent } from '@/types/session';

vi.mock('@/services/session.service');
vi.mock('@/services/problem.service');
vi.mock('@/services/user.service');

const tutor: UserResponse = {
  id: 'tutor-1',
  nome: 'Professor Fulano',
  email: 'fulano@uefs.br',
  tipo: 'PROFESSOR',
  matricula: null,
  possuiFoto: false,
  ativo: true,
  criadoEm: '2026-08-01T10:00:00.000Z',
};

const student = (
  alunoId: string,
  nome: string,
  extra: Partial<RollCallStudent> = {},
): RollCallStudent => ({
  alunoId,
  nome,
  iniciais: nome
    .split(' ')
    .map((part) => part[0])
    .join(''),
  lugar: null,
  status: null,
  justificativa: null,
  ...extra,
});

function rollCall(alunos: RollCallStudent[], extra: Partial<RollCall> = {}): RollCall {
  return {
    sessaoId: 's1',
    origem: 'VAZIA',
    sessaoReferencia: null,
    registradaEm: null,
    lugares: alunos.length,
    alunos,
    totais: {
      presentes: 0,
      atrasados: 0,
      justificados: 0,
      ausentes: 0,
      semRegistro: alunos.length,
    },
    ...extra,
  };
}

const ana = student('ana', 'Ana Souza');
const bruno = student('bruno', 'Bruno Martins');
const carla = student('carla', 'Carla Dias');

function openRollCall(data: RollCall) {
  vi.mocked(sessionService.getRollCall).mockResolvedValue(data);
  sessionStore.save(sessionFor(tutor));
  return renderApp('/sessoes/s1/chamada');
}

const counter = (label: string) => screen.getByText(label).closest('div')!;

describe('RollCallPage', () => {
  beforeAll(async () => {
    await import('./RollCallPage');
  });

  beforeEach(() => {
    vi.mocked(userService.getPhoto).mockRejectedValue(new ApiError(404, ['Foto não encontrada.']));
    vi.mocked(sessionService.listRoles).mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.resetAllMocks();
    localStorage.clear();
    Reflect.deleteProperty(document, 'elementFromPoint');
  });

  it('opens with the table of the previous session and says where it came from', async () => {
    openRollCall(
      rollCall([student('ana', 'Ana Souza', { lugar: 2, status: 'PRESENTE' }), bruno], {
        origem: 'SESSAO_ANTERIOR',
        sessaoReferencia: { id: 's0', data: '2026-08-12' },
      }),
    );

    expect(
      await screen.findByText('Mesa preenchida conforme a sessão de 12/08'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Lugar 2: Ana Souza, Presente' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bruno Martins, fora da mesa' })).toBeInTheDocument();
    expect(within(counter('Presentes')).getByText('1')).toBeInTheDocument();
  });

  it('seats a student by tapping the photo and then a free seat, marking them present', async () => {
    const { user } = openRollCall(rollCall([ana, bruno]));

    await user.click(await screen.findByRole('button', { name: 'Ana Souza, fora da mesa' }));
    expect(
      screen.getByText('Toque em um lugar da mesa para sentar Ana Souza.'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Lugar 2, livre' }));

    expect(
      screen.getByRole('button', { name: 'Lugar 2: Ana Souza, Presente' }),
    ).toBeInTheDocument();
    expect(within(counter('Presentes')).getByText('1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar chamada' })).toBeEnabled();
  });

  it('swaps two seated students by dragging one onto the other', async () => {
    openRollCall(
      rollCall(
        [
          student('ana', 'Ana Souza', { lugar: 1, status: 'PRESENTE' }),
          student('bruno', 'Bruno Martins', { lugar: 2, status: 'ATRASADO' }),
        ],
        { origem: 'REGISTRADA' },
      ),
    );
    const anaSeat = await screen.findByRole('button', { name: 'Lugar 1: Ana Souza, Presente' });
    const brunoSeat = screen.getByRole('button', { name: 'Lugar 2: Bruno Martins, Atrasado' });
    Object.defineProperty(document, 'elementFromPoint', {
      value: () => brunoSeat,
      configurable: true,
    });

    fireEvent.pointerDown(anaSeat, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(anaSeat, { clientX: 80, clientY: 90 });
    fireEvent.pointerUp(anaSeat, { clientX: 80, clientY: 90 });

    expect(
      screen.getByRole('button', { name: 'Lugar 2: Ana Souza, Presente' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Lugar 1: Bruno Martins, Atrasado' }),
    ).toBeInTheDocument();
  });

  it('seats everyone left in the free seats and then marks nobody absent', async () => {
    const { user } = openRollCall(rollCall([ana, bruno, carla]));

    await user.click(await screen.findByRole('button', { name: 'Sentar todos' }));

    expect(screen.getByText('Todos os alunos estão na mesa.')).toBeInTheDocument();
    expect(within(counter('Presentes')).getByText('3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restantes ausentes' })).toBeDisabled();
  });

  it('marks as absent everyone still off the table without status', async () => {
    const { user } = openRollCall(
      rollCall([student('ana', 'Ana Souza', { lugar: 1, status: 'PRESENTE' }), bruno, carla]),
    );

    await user.click(await screen.findByRole('button', { name: 'Restantes ausentes' }));

    expect(within(counter('Ausentes')).getByText('2')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Bruno Martins, fora da mesa, Ausente' }),
    ).toBeInTheDocument();
  });

  it('asks for the justification and takes an excused student off the table', async () => {
    vi.mocked(sessionService.saveRollCall).mockImplementation(async (_id, registros) =>
      rollCall(
        [
          student('ana', 'Ana Souza', {
            status: 'JUSTIFICADO',
            justificativa: registros[0]!.justificativa,
          }),
        ],
        {
          origem: 'REGISTRADA',
        },
      ),
    );
    const { user } = openRollCall(
      rollCall([student('ana', 'Ana Souza', { lugar: 1, status: 'PRESENTE' })], {
        origem: 'REGISTRADA',
      }),
    );

    await user.click(await screen.findByRole('button', { name: 'Lugar 1: Ana Souza, Presente' }));
    expect(screen.getByText('Lugar 1 • Presente')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Justificado' }));
    await user.click(screen.getByRole('button', { name: 'Justificar falta' }));
    expect(screen.getByText('Informe o motivo da falta justificada.')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Justificativa'), 'Atestado médico');
    await user.click(screen.getByRole('button', { name: 'Justificar falta' }));

    expect(screen.getByRole('button', { name: 'Lugar 1, livre' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Ana Souza, fora da mesa, Justificado' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Salvar chamada' }));
    expect(sessionService.saveRollCall).toHaveBeenCalledWith('s1', [
      { alunoId: 'ana', status: 'JUSTIFICADO', lugar: null, justificativa: 'Atestado médico' },
    ]);
    expect(await screen.findByText('Chamada salva.')).toBeInTheDocument();
  });

  it('switches back from excused to present without getting stuck', async () => {
    const { user } = openRollCall(
      rollCall([student('ana', 'Ana Souza', { lugar: 1, status: 'PRESENTE' })], {
        origem: 'REGISTRADA',
      }),
    );

    await user.click(await screen.findByRole('button', { name: 'Lugar 1: Ana Souza, Presente' }));
    await user.click(screen.getByRole('radio', { name: 'Justificado' }));
    expect(screen.getByLabelText('Justificativa')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Atrasado' }));

    expect(screen.queryByLabelText('Justificativa')).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Atrasado' })).toHaveAttribute('aria-checked', 'true');
    expect(
      screen.getByRole('button', { name: 'Lugar 1: Ana Souza, Atrasado' }),
    ).toBeInTheDocument();
  });

  it('seats an excused student again when marked late from the carômetro', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    openRollCall(
      rollCall(
        [student('ana', 'Ana Souza', { status: 'JUSTIFICADO', justificativa: 'Atestado' })],
        {
          origem: 'REGISTRADA',
        },
      ),
    );
    const chip = await screen.findByRole('button', {
      name: 'Ana Souza, fora da mesa, Justificado',
    });

    fireEvent.pointerDown(chip, { button: 0, clientX: 5, clientY: 5 });
    await vi.advanceTimersByTimeAsync(600);
    fireEvent.pointerUp(chip, { clientX: 5, clientY: 5 });
    fireEvent.click(await screen.findByRole('radio', { name: 'Atrasado' }));

    expect(
      await screen.findByRole('button', { name: 'Lugar 1: Ana Souza, Atrasado' }),
    ).toBeInTheDocument();
  });

  it('lets a student off the table be marked absent with a long press', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    openRollCall(rollCall([ana]));
    const chip = await screen.findByRole('button', { name: 'Ana Souza, fora da mesa' });

    fireEvent.pointerDown(chip, { button: 0, clientX: 5, clientY: 5 });
    await vi.advanceTimersByTimeAsync(600);
    fireEvent.pointerUp(chip, { clientX: 5, clientY: 5 });

    expect(await screen.findByText('Fora da mesa • Sem registro')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tirar da mesa' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'Ausente' }));
    expect(
      await screen.findByRole('button', { name: 'Ana Souza, fora da mesa, Ausente' }),
    ).toBeInTheDocument();
  });

  it('offers to transfer a role that another student already holds', async () => {
    vi.mocked(sessionService.assignRole)
      .mockRejectedValueOnce(
        new ApiError(409, ['O papel já está ocupado.'], {
          ocupadoPor: { studentId: 'carla', name: 'Carla Dias' },
        }),
      )
      .mockResolvedValueOnce({ alunoId: 'ana', papel: 'COORDENADOR', notaAdicional: 0.5 });
    const { user } = openRollCall(
      rollCall([student('ana', 'Ana Souza', { lugar: 1, status: 'PRESENTE' }), carla], {
        origem: 'REGISTRADA',
      }),
    );

    await user.click(await screen.findByRole('button', { name: 'Lugar 1: Ana Souza, Presente' }));
    await user.click(screen.getByRole('button', { name: 'Atribuir papel na sessão' }));
    await user.click(screen.getByRole('radio', { name: 'Coordenador' }));
    await user.type(screen.getByLabelText('Nota adicional pelo papel (opcional)'), '0,5');
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(await screen.findByText(/já é de/)).toHaveTextContent(
      'O papel de Coordenador já é de Carla Dias. Transferir para Ana Souza?',
    );
    await user.click(screen.getByRole('button', { name: 'Transferir' }));

    expect(sessionService.assignRole).toHaveBeenLastCalledWith('s1', 'ana', {
      papel: 'COORDENADOR',
      notaAdicional: 0.5,
      transferir: true,
    });
    expect(await screen.findByText('Papel atribuído.')).toBeInTheDocument();
  });

  it('opens from the session screen address with the problem and session in the header', async () => {
    vi.mocked(sessionService.getRollCall).mockResolvedValue(rollCall([ana]));
    vi.mocked(problemService.getById).mockResolvedValue({
      titulo: 'Sistema de biblioteca',
    } as never);
    vi.mocked(sessionService.getById).mockResolvedValue({
      titulo: 'Abertura',
      data: '2026-08-12',
    } as never);
    sessionStore.save(sessionFor(tutor));

    renderApp('/turmas/r1/problemas/p1/sessoes/s1/chamada');

    expect(
      await screen.findByRole('heading', { name: 'Chamada - Sistema de biblioteca' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Abertura · 12/08')).toBeInTheDocument();
    expect(sessionService.getRollCall).toHaveBeenCalledWith('s1');
    expect(screen.getByRole('button', { name: 'Ana Souza, fora da mesa' })).toBeInTheDocument();
  });

  it('asks before leaving with unsaved changes', async () => {
    const { user } = openRollCall(rollCall([ana, bruno]));

    await user.click(await screen.findByRole('button', { name: 'Sentar todos' }));
    await user.click(screen.getByRole('button', { name: 'Voltar' }));

    expect(screen.getByRole('dialog', { name: 'Sair sem salvar?' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continuar editando' }));
    expect(screen.queryByRole('dialog', { name: 'Sair sem salvar?' })).not.toBeInTheDocument();
  });
});
