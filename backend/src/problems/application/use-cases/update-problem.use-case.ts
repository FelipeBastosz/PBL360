import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PROBLEM_REPOSITORY, ProblemRepository } from '../../domain/repositories/problem.repository';
import { UpdateProblemDto } from '../dtos/update-problem.dto';
import { Problem } from '../../domain/entities/problem.entity';

@Injectable()
export class UpdateProblemUseCase {
  constructor(
    @Inject(PROBLEM_REPOSITORY)
    private readonly repository: ProblemRepository,
  ) {}

  async execute(id: string, dto: UpdateProblemDto): Promise<Problem> {
    const problem = await this.repository.findById(id);
    if (!problem) {
      throw new NotFoundException(`Problema com id '${id}' não encontrado.`);
    }
    problem.title = dto.title.trim();
    return this.repository.save(problem);
  }
}
