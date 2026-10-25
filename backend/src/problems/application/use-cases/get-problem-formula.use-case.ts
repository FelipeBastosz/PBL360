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
  scope: FormulaScope;
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

    if (input.scope !== FormulaScope.PROBLEMA) {
      throw new UnprocessableEntityError(
        'A fórmula da sessão deve ser consultada pela configuração da própria sessão.',
      );
    }
    await this.validateProblem(input);

    const activeFormula = await this.formulas.findActiveByProblemAndScope(
      input.problemId,
      input.scope,
    );
    if (activeFormula) {
      return this.buildActiveFormula(input.scope, activeFormula);
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
    const percentageComponents = activeFormula.components.filter((c) => c.type !== 'SESSAO');
    return {
      scope,
      isDefault: false,
      version: activeFormula.version,
      components:
        (percentageComponents.length ? percentageComponents : null)?.map((c) => ({
          type: c.type,
          referenceId: c.referenceId,
          name: this.getDefaultNameForType(c.type),
          weight: Number(c.weight),
        })) ?? this.getProblemScopeComponents(),
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
    return [
      this.createComponent(FormulaComponentType.MEDIA_SESSOES, 'Média das Sessões', 100),
      this.createComponent(FormulaComponentType.AUTOAVALIACAO, 'Autoavaliação', 0),
      this.createComponent(FormulaComponentType.PARES, 'Avaliação por Pares', 0),
    ];
  }

  private createComponent(type: string, name: string, weight: number): ProblemFormulaComponent {
    return { type, referenceId: null, name, weight };
  }

  private getDefaultNameForType(type: string): string | null {
    switch (type as FormulaComponentType) {
      case FormulaComponentType.MEDIA_SESSOES:
        return 'Média das Sessões';
      case FormulaComponentType.AUTOAVALIACAO:
        return 'Autoavaliação';
      case FormulaComponentType.PARES:
        return 'Avaliação por Pares';
      case FormulaComponentType.CRITERIO:
        return null;
      default:
        return null;
    }
  }
}
