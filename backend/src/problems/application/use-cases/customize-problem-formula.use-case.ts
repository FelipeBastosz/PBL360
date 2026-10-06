import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError, UnprocessableEntityError } from '@/shared/errors/application.error';
import { Formula, FormulaScope } from '../../domain/entities/formula.entity';
import { FORMULA_REPOSITORY } from '../../domain/repositories/formula.repository';
import type { FormulaRepository } from '../../domain/repositories/formula.repository';
import { PROBLEM_REPOSITORY } from '../../domain/repositories/problem.repository';
import type { ProblemRepository } from '../../domain/repositories/problem.repository';
import { PERFORMANCE_TABLE_REPOSITORY } from '@/performance-tables/domain/repositories/performance-table.repository';
import type { PerformanceTableRepository } from '@/performance-tables/domain/repositories/performance-table.repository';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import {
  GetProblemFormulaUseCase,
  type ProblemFormulaOutput,
} from './get-problem-formula.use-case';

import type { Problem } from '../../domain/entities/problem.entity';

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
    @Inject(PERFORMANCE_TABLE_REPOSITORY) private readonly tables: PerformanceTableRepository,
    private readonly roomAccessService: RoomAccessService,
    private readonly getFormulaUseCase: GetProblemFormulaUseCase,
  ) {}

  async execute(input: CustomizeProblemFormulaInput): Promise<ProblemFormulaOutput> {
    await this.roomAccessService.assertTutorCanAccessRoom(input.roomId, input.tutorId);
    const problem = await this.validateProblem(input);
    await this.validateFormulaScope(input, problem);

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
      this.handleFormulaError(error);
    }
  }

  private handleFormulaError(error: unknown): never {
    const msg = error instanceof Error ? error.message : String(error);
    throw new UnprocessableEntityError(msg);
  }

  private async validateProblem(input: CustomizeProblemFormulaInput) {
    const problem = await this.problems.findById(input.problemId);
    if (!problem || problem.roomId !== input.roomId) {
      throw new NotFoundError('Problema não encontrado na sala informada.');
    }
    return problem;
  }

  private async validateFormulaScope(input: CustomizeProblemFormulaInput, problem: Problem) {
    if (input.scope === FormulaScope.SESSAO) {
      if (!problem.performanceTableId) {
        throw new UnprocessableEntityError('O problema não possui uma tabela vinculada.');
      }
      const table = await this.tables.findByIdIncludingDeleted(problem.performanceTableId);
      const validCriteriaIds = new Set(table?.criteria.map((c) => c.id) || []);

      for (const comp of input.components) {
        if (!validCriteriaIds.has(comp.referenceId!)) {
          throw new UnprocessableEntityError(
            'Um ou mais critérios não pertencem à tabela deste problema.',
          );
        }
      }
    }
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
      components: input.components.map((c) => ({
        type: c.type,
        referenceId: c.referenceId,
        weight: c.weight,
      })),
    });
  }
}
