import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError, UnprocessableEntityError } from '@/shared/errors/application.error';
import { FormulaScope } from '../../domain/entities/formula.entity';
import {
  FORMULA_REPOSITORY,
  type FormulaRepository,
} from '../../domain/repositories/formula.repository';
import {
  PROBLEM_REPOSITORY,
  type ProblemRepository,
} from '../../domain/repositories/problem.repository';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import {
  GetProblemFormulaUseCase,
  type ProblemFormulaOutput,
} from './get-problem-formula.use-case';

export interface RestoreDefaultFormulaInput {
  roomId: string;
  problemId: string;
  tutorId: string;
  scope: FormulaScope;
}

@Injectable()
export class RestoreDefaultFormulaUseCase {
  constructor(
    @Inject(PROBLEM_REPOSITORY) private readonly problems: ProblemRepository,
    @Inject(FORMULA_REPOSITORY) private readonly formulas: FormulaRepository,
    private readonly roomAccessService: RoomAccessService,
    private readonly getFormulaUseCase: GetProblemFormulaUseCase,
  ) {}

  async execute(input: RestoreDefaultFormulaInput): Promise<ProblemFormulaOutput> {
    await this.roomAccessService.assertTutorCanAccessRoom(input.roomId, input.tutorId);

    if (input.scope !== FormulaScope.PROBLEMA) {
      throw new UnprocessableEntityError(
        'A fórmula da sessão deve ser restaurada pela configuração da própria sessão.',
      );
    }
    const problem = await this.problems.findById(input.problemId);
    if (!problem || problem.roomId !== input.roomId) {
      throw new NotFoundError('Problema não encontrado na sala informada.');
    }

    const activeFormula = await this.formulas.findActiveByProblemAndScope(
      input.problemId,
      input.scope,
    );
    if (activeFormula) {
      await this.formulas.deactivate(activeFormula);
    }

    return this.getFormulaUseCase.execute(input);
  }
}
