import { Discipline } from '../../domain/entities/discipline.entity';
import type { DisciplineRepository } from '../../domain/repositories/discipline.repository';
import { ListDisciplinesUseCase } from './list-disciplines.use-case';

describe('ListDisciplinesUseCase', () => {
  it('lists every registered discipline', async () => {
    const disciplines = [
      Object.assign(new Discipline(), { id: 'd-1', code: 'EXA863', name: 'MI Programação' }),
    ];
    const repository: jest.Mocked<DisciplineRepository> = { findAll: jest.fn() };
    repository.findAll.mockResolvedValue(disciplines);

    const useCase = new ListDisciplinesUseCase(repository);

    await expect(useCase.execute()).resolves.toEqual(disciplines);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
  });
});
