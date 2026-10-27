import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError, UnprocessableEntityError } from '@/shared/errors/application.error';
import { Formula, FormulaScope } from '../../domain/entities/formula.entity';
import { InvalidProblemError } from '../../domain/errors/invalid-problem.error';
import { FORMULA_REPOSITORY } from '../../domain/repositories/formula.repository';
import type { FormulaRepository } from '../../domain/repositories/formula.repository';
import { PROBLEM_REPOSITORY } from '../../domain/repositories/problem.repository';
import type { ProblemRepository } from '../../domain/repositories/problem.repository';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import {
  GetProblemFormulaUseCase,
  type ProblemFormulaOutput,
} from './get-problem-formula.use-case';

export interface CustomizeFormulaComponentInput {
  type: string;
  referenceId?: string | null;
  weight: number;
}

export interface CustomizeProblemFormulaInput {
  roomId: string;
  problemId: string;
  tutorId: string;
  scope: FormulaScope;
  components: CustomizeFormulaComponentInput[];
}

@Injectable()
export class CustomizeProblemFormulaUseCase {
  constructor(
    @Inject(PROBLEM_REPOSITORY) private readonly problems: ProblemRepository,
    @Inject(FORMULA_REPOSITORY) private readonly formulas: FormulaRepository,
    private readonly roomAccessService: RoomAccessService,
    private readonly getFormulaUseCase: GetProblemFormulaUseCase,
  ) {}

  async execute(input: CustomizeProblemFormulaInput): Promise<ProblemFormulaOutput> {
    await this.roomAccessService.assertTutorCanAccessRoom(input.roomId, input.tutorId);
    await this.validateProblem(input);
    assertFormulaCustomizationInput(input);
    await this.updateFormula(input);

    return this.getFormulaUseCase.execute({
      roomId: input.roomId,
      problemId: input.problemId,
      tutorId: input.tutorId,
      scope: input.scope,
    });
  }

  private async updateFormula(input: CustomizeProblemFormulaInput): Promise<void> {
    const oldFormula = await this.formulas.findActiveByProblemAndScope(
      input.problemId,
      input.scope,
    );
    try {
      const candidate = this.createFormulaCandidate(input, oldFormula);
      await this.formulas.saveNewVersion(oldFormula, candidate);
    } catch (error) {
      if (error instanceof InvalidProblemError) {
        throw new UnprocessableEntityError(error.message);
      }
      throw error;
    }
  }

  private async validateProblem(input: CustomizeProblemFormulaInput) {
    const problem = await this.problems.findById(input.problemId);
    if (!problem || problem.roomId !== input.roomId) {
      throw new NotFoundError('Problema não encontrado na sala informada.');
    }
    return problem;
  }

  private createFormulaCandidate(
    input: CustomizeProblemFormulaInput,
    oldFormula: Formula | null,
  ): Formula {
    return Formula.create({
      problemId: input.problemId,
      scope: input.scope,
      version: oldFormula ? oldFormula.version + 1 : 1,
      active: true,
      createdBy: input.tutorId,
      components: [
        ...input.components.map(({ type, referenceId, weight }) => ({
          type,
          referenceId,
          weight,
        })),
        ...preservedSessionComponents(oldFormula),
      ],
    });
  }
}

function assertFormulaCustomizationInput(input: CustomizeProblemFormulaInput): void {
  if (input.scope !== FormulaScope.PROBLEMA) {
    throw new UnprocessableEntityError(
      'A fórmula da sessão deve ser personalizada pela configuração da própria sessão.',
    );
  }
  const [component] = input.components;
  if (
    input.components.length !== 1 ||
    !component ||
    component.type !== 'MEDIA_SESSOES' ||
    component.referenceId != null ||
    component.weight !== 100
  ) {
    throw new UnprocessableEntityError(
      'A nota do problema é a média das sessões; configure os pesos pela fórmula final.',
    );
  }
}

function preservedSessionComponents(formula: Formula | null) {
  return (
    formula?.components
      .filter((component) => component.type === 'SESSAO')
      .map(({ type, referenceId, weight }) => ({
        type,
        referenceId,
        weight: Number(weight),
      })) ?? []
  );
}
