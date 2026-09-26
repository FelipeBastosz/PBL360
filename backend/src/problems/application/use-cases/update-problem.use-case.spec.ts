import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { PROBLEM_REPOSITORY } from '../../domain/repositories/problem.repository';
import type { Problem } from '../../domain/entities/problem.entity';
import type { UpdateProblemDto } from '../dtos/update-problem.dto';
import { UpdateProblemUseCase } from './update-problem.use-case';

const mockProblem = {
  id: 'prob-1',
  title: 'Título antigo',
} as unknown as Problem;

describe('UpdateProblemUseCase', () => {
  let useCase: UpdateProblemUseCase;
  let repository: { findById: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    repository = {
      findById: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UpdateProblemUseCase, { provide: PROBLEM_REPOSITORY, useValue: repository }],
    }).compile();

    useCase = module.get(UpdateProblemUseCase);
  });

  it('should update the title when the problem exists', async () => {
    repository.findById.mockResolvedValue(mockProblem);
    repository.save.mockImplementation((p: Problem) => Promise.resolve(p));

    const dto: UpdateProblemDto = { title: 'Novo título' };
    const result = await useCase.execute('prob-1', dto);

    expect(repository.findById).toHaveBeenCalledWith('prob-1');
    expect(repository.save).toHaveBeenCalled();
    expect(result.title).toBe('Novo título');
  });

  it('should throw NotFoundException when the problem does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    const dto: UpdateProblemDto = { title: 'Algo' };
    await expect(useCase.execute('invalid-id', dto)).rejects.toThrow(NotFoundException);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
