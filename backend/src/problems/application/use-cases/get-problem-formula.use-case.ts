import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError, UnprocessableEntityError } from '@/shared/errors/application.error';
import { Formula, FormulaScope } from '../../domain/entities/formula.entity';
import { FormulaComponentType } from '../../domain/entities/formula-component.entity';
import { FORMULA_REPOSITORY } from '../../domain/repositories/formula.repository';
import type { FormulaRepository } from '../../domain/repositories/formula.repository';
import { PROBLEM_REPOSITORY } from '../../domain/repositories/problem.repository';
import type { ProblemRepository } from '../../domain/repositories/problem.repository';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import type { Problem } from '../../domain/entities/problem.entity';

export interface GetProblemFormulaInput {
  roomId: string;
  problemId: string;
  tutorId: string;
  scope?: FormulaScope;
}

export interface ProblemFormulaComponent {
  type: string;
  referenceId: string | null;
  name: string | null;
  weight: number;
}

export interface ProblemFormulaOutput {
  scope: FormulaScope;
  isDefault: boolean;
  version: number | null;
  components: ProblemFormulaComponent[];
}

@Injectable()
export class GetProblemFormulaUseCase {
  constructor(
    @Inject(PROBLEM_REPOSITORY) private readonly problems: ProblemRepository,
    @Inject(FORMULA_REPOSITORY) private readonly formulas: FormulaRepository,
    private readonly roomAccessService: RoomAccessService,
  ) {}

  async execute(input: GetProblemFormulaInput): Promise<ProblemFormulaOutput> {
    await this.roomAccessService.assertTutorCanAccessRoom(input.roomId, input.tutorId);

    const scope = input.scope ?? FormulaScope.PROBLEMA;
    if (scope !== FormulaScope.PROBLEMA) {
      throw new UnprocessableEntityError(
        'A fórmula da sessão deve ser consultada pela configuração da própria sessão.',
      );
    }
    await this.validateProblem(input);

    const activeFormula = await this.formulas.findActiveByProblemAndScope(input.problemId, scope);
    if (activeFormula) {
      return this.buildActiveFormula(scope, activeFormula);
    }

    return this.buildProblemScopeFormula();
  }

  private async validateProblem(input: GetProblemFormulaInput): Promise<Problem> {
    const problem = await this.problems.findById(input.problemId);
    if (!problem || problem.roomId !== input.roomId) {
      throw new NotFoundError('Problema não encontrado na sala informada.');
    }
    return problem;
  }

  private buildActiveFormula(scope: FormulaScope, activeFormula: Formula): ProblemFormulaOutput {
    return {
      scope,
      isDefault: false,
      version: activeFormula.version,
      components: this.getProblemScopeComponents(),
    };
  }

  private buildProblemScopeFormula(): ProblemFormulaOutput {
    return {
      scope: FormulaScope.PROBLEMA,
      isDefault: true,
      version: null,
      components: this.getProblemScopeComponents(),
    };
  }

  private getProblemScopeComponents() {
    return [this.createComponent(FormulaComponentType.MEDIA_SESSOES, 'Média das Sessões', 100)];
  }

  private createComponent(type: string, name: string, weight: number): ProblemFormulaComponent {
    return { type, referenceId: null, name, weight };
  }
}
