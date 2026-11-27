import { ObservationsController } from './observations.controller';

describe('ObservationsController', () => {
  it('complements an observation and delegates undo', async () => {
    const observation = {
      id: 'o1',
      tags: [],
      text: 'Complemento',
      createdAt: new Date('2025-01-01'),
    };
    const complement = { execute: jest.fn().mockResolvedValue(observation) };
    const undo = { execute: jest.fn().mockResolvedValue(undefined) };
    const controller = new ObservationsController(complement as never, undo as never);

    await expect(controller.complement('o1', { texto: 'Complemento' }, 't1')).resolves.toEqual({
      id: 'o1',
      marcacoes: [],
      texto: 'Complemento',
      criadaEm: observation.createdAt,
    });
    expect(complement.execute).toHaveBeenCalledWith({
      id: 'o1',
      tutorId: 't1',
      text: 'Complemento',
    });
    await expect(controller.undo('o1', 't1')).resolves.toBeUndefined();
    expect(undo.execute).toHaveBeenCalledWith({ id: 'o1', tutorId: 't1' });
  });
});
