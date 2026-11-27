import { PokerOrder } from '../../domain/entities/planning-poker';
import { PokerOrderPayload } from '../../application/dtos/planning-poker-request.dto';
import { PlanningPokerController } from './planning-poker.controller';

describe('PlanningPokerController', () => {
  const state = {
    poker: { id: 'p1', anonymous: false, order: PokerOrder.SEQUENTIAL },
    participants: [],
    absentees: [],
    queue: [],
    completed: [],
    current: null,
  };

  it('starts a poker using the requested order and maps its state', async () => {
    const start = { execute: jest.fn().mockResolvedValue(state) };
    const controller = new PlanningPokerController(
      start as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(
      controller.start('s1', { ordem: PokerOrderPayload.SEQUENCIAL, anonimo: true }, 't1'),
    ).resolves.toMatchObject({
      pokerId: 'p1',
      ordem: PokerOrderPayload.SEQUENCIAL,
      anonimo: false,
    });
    expect(start.execute).toHaveBeenCalledWith({
      sessionId: 's1',
      tutorId: 't1',
      anonymous: true,
      order: PokerOrder.SEQUENTIAL,
    });
  });

  it('maps tutor and student state, availability and queue responses', async () => {
    const getState = { execute: jest.fn().mockResolvedValue({ audience: 'TUTOR', state }) };
    const getAvailability = {
      execute: jest
        .fn()
        .mockResolvedValue({ blockReason: null, presentStudents: 3, openPokerId: 'p1' }),
    };
    const reorder = { execute: jest.fn().mockResolvedValue(['a1', 'a2']) };
    const controller = new PlanningPokerController(
      {} as never,
      getState as never,
      getAvailability as never,
      reorder as never,
      {} as never,
    );

    await expect(
      controller.state('s1', { id: 't1', type: 'TUTOR' } as never),
    ).resolves.toMatchObject({ pokerId: 'p1' });
    await expect(
      controller.state('s1', { id: 'a1', type: 'STUDENT' } as never),
    ).resolves.toMatchObject({ pokerId: 'p1' });
    await expect(controller.availability('s1', 't1')).resolves.toEqual({
      disponivel: true,
      motivo: null,
      presentes: 3,
      pokerAbertoId: 'p1',
    });
    await expect(controller.reorder('s1', { fila: ['a1', 'a2'] }, 't1')).resolves.toEqual({
      fila: ['a1', 'a2'],
    });
    expect(reorder.execute).toHaveBeenCalledWith({
      sessionId: 's1',
      tutorId: 't1',
      queue: ['a1', 'a2'],
    });
  });

  it('closes the poker and maps evaluated and pending students', async () => {
    const close = {
      execute: jest.fn().mockResolvedValue({
        evaluated: 1,
        notEvaluated: [{ id: 'a2', name: 'Ana' }],
        results: [{ student: { id: 'a1', name: 'Bia' }, finalGrade: 8, adjusted: false }],
      }),
    };
    const controller = new PlanningPokerController(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      close as never,
    );

    await expect(controller.close('s1', 't1')).resolves.toEqual({
      avaliados: 1,
      naoAvaliados: [{ alunoId: 'a2', nome: 'Ana' }],
      resultados: [{ alunoId: 'a1', nome: 'Bia', notaFinal: 8, ajustada: false }],
    });
    expect(close.execute).toHaveBeenCalledWith('s1', 't1');
  });
});
