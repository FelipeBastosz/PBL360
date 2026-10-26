import { ConflictError } from '@/shared/errors/application.error';
import { Discipline } from '../../domain/entities/discipline.entity';
import type { DisciplineRepository } from '../../domain/repositories/discipline.repository';
import { CreateDisciplineUseCase } from './create-discipline.use-case';

describe('CreateDisciplineUseCase', () => {
  let repository: jest.Mocked<DisciplineRepository>;
  let useCase: CreateDisciplineUseCase;

  beforeEach(() => {
    repository = { findAll: jest.fn(), create: jest.fn() };
    useCase = new CreateDisciplineUseCase(repository);
  });

  it('creates the discipline with the normalized code', async () => {
    repository.create.mockImplementation((discipline) =>
      Promise.resolve(Object.assign(discipline, { id: 'd-1' })),
    );

    const created = await useCase.execute({ code: 'exa999', name: ' MI Nova ' });

    expect(created).toMatchObject({ id: 'd-1', code: 'EXA999', name: 'MI Nova' });
    expect(repository.create).toHaveBeenCalledWith(expect.any(Discipline));
  });

  it('rejects a code that is already registered', async () => {
    repository.create.mockResolvedValue(null);

    await expect(useCase.execute({ code: 'EXA863', name: 'Outra' })).rejects.toThrow(
      new ConflictError('Já existe uma disciplina com o código EXA863.'),
    );
  });
});
