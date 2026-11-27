import { PeerEvaluationsController } from './peer-evaluations.controller';

describe('PeerEvaluationsController', () => {
  it('returns available peers and their evaluation status', async () => {
    const peers = {
      execute: jest.fn().mockResolvedValue({
        liberada: true,
        prazo: null,
        chamadaRealizada: true,
        colegas: [{ alunoId: 's2', nome: 'Bia', iniciais: 'B', status: 'PENDENTE', papel: null }],
      }),
    };
    const evaluation = {
      execute: jest.fn().mockResolvedValue({
        colega: { alunoId: 's2', nome: 'Bia', papel: null },
        status: 'RASCUNHO',
        enviadaEm: null,
        notaCargo: null,
        criterios: [{ id: 'c1', nome: 'Colaboração', peso: 100, notaMaxima: 10 }],
        itens: [{ criterioId: 'c1', nota: 7 }],
      }),
    };
    const controller = new PeerEvaluationsController(
      peers as never,
      evaluation as never,
      {} as never,
    );

    await expect(controller.list('sess1', 's1')).resolves.toMatchObject({
      liberada: true,
      colegas: [{ alunoId: 's2' }],
    });
    expect(peers.execute).toHaveBeenCalledWith('sess1', 's1');
    await expect(controller.get('sess1', 's2', 's1')).resolves.toMatchObject({
      colega: { alunoId: 's2' },
      itens: [{ nota: 7 }],
    });
    expect(evaluation.execute).toHaveBeenCalledWith('sess1', 's2', 's1');
  });

  it('maps and saves peer evaluation data for the authenticated student', async () => {
    const result = {
      colega: { alunoId: 's2', nome: 'Bia', papel: null },
      status: 'ENVIADA',
      enviadaEm: new Date(),
      notaCargo: 8,
      criterios: [],
      itens: [],
    };
    const save = { execute: jest.fn().mockResolvedValue(result) };
    const controller = new PeerEvaluationsController({} as never, {} as never, save as never);

    await controller.put('sess1', 's2', 's1', {
      itens: [{ criterioId: 'c1', nota: 6 }],
      enviar: true,
    });
    expect(save.execute).toHaveBeenCalledWith({
      sessionId: 'sess1',
      peerId: 's2',
      studentId: 's1',
      itens: [{ criterionId: 'c1', score: 6 }],
      enviar: true,
      notaCargo: undefined,
    });
  });
});
