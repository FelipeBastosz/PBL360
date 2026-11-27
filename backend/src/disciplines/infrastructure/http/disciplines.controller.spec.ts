import { Discipline } from '../../domain/entities/discipline.entity';
import { DisciplinesController } from './disciplines.controller';

describe('DisciplinesController', () => {
  it('lists disciplines using the Portuguese response contract', async () => {
    const listDisciplines = {
      execute: jest
        .fn()
        .mockResolvedValue([
          Object.assign(new Discipline(), { id: 'd-1', code: 'BIO101', name: 'Biologia' }),
        ]),
    };
    const createDiscipline = { execute: jest.fn() };
    const controller = new DisciplinesController(
      listDisciplines as never,
      createDiscipline as never,
    );

    await expect(controller.list()).resolves.toEqual([
      { id: 'd-1', codigo: 'BIO101', nome: 'Biologia' },
    ]);
    expect(listDisciplines.execute).toHaveBeenCalledTimes(1);
  });

  it('creates a discipline from the API payload', async () => {
    const listDisciplines = { execute: jest.fn() };
    const created = Object.assign(new Discipline(), {
      id: 'd-2',
      code: 'MED201',
      name: 'Medicina',
    });
    const createDiscipline = { execute: jest.fn().mockResolvedValue(created) };
    const controller = new DisciplinesController(
      listDisciplines as never,
      createDiscipline as never,
    );

    await expect(controller.create({ codigo: 'MED201', nome: 'Medicina' })).resolves.toEqual({
      id: 'd-2',
      codigo: 'MED201',
      nome: 'Medicina',
    });
    expect(createDiscipline.execute).toHaveBeenCalledWith({
      code: 'MED201',
      name: 'Medicina',
    });
  });
});
