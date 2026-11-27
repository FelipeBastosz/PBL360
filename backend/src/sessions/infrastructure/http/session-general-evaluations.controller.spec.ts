import { UserType } from '@/users/domain/enums/user-type.enum';
import { SessionGeneralEvaluationsController } from './session-general-evaluations.controller';

describe('SessionGeneralEvaluationsController', () => {
  const member = { id: 't1', type: UserType.TUTOR };
  const record = {
    id: 'e1',
    text: 'Orientação geral',
    author: { id: 't1', name: 'Tutor' },
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-02T00:00:00Z'),
  };

  it('maps all general evaluations for a session', async () => {
    const get = { execute: jest.fn().mockResolvedValue([record]) };
    const controller = new SessionGeneralEvaluationsController(get as never, {} as never);

    await expect(controller.get('sess1', member)).resolves.toEqual([
      {
        id: 'e1',
        texto: 'Orientação geral',
        autor: { id: 't1', nome: 'Tutor' },
        criadoEm: record.createdAt,
        editadoEm: record.updatedAt,
      },
    ]);
    expect(get.execute).toHaveBeenCalledWith('sess1', member);
  });

  it('saves text using the authenticated member identity and type', async () => {
    const save = { execute: jest.fn().mockResolvedValue(record) };
    const controller = new SessionGeneralEvaluationsController({} as never, save as never);

    await expect(
      controller.save('sess1', { texto: 'Orientação geral' }, member),
    ).resolves.toMatchObject({ id: 'e1' });
    expect(save.execute).toHaveBeenCalledWith('sess1', 'Orientação geral', 't1', UserType.TUTOR);
  });
});
