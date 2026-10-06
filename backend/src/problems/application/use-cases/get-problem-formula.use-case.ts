import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError, UnprocessableEntityError } from '@/shared/errors/application.error';
import { Formula, FormulaScope } from '../../domain/entities/formula.entity';
import { FormulaComponentType } from '../../domain/entities/formula-component.entity';
import { FORMULA_REPOSITORY } from '../../domain/repositories/formula.repository';
import type { FormulaRepository } from '../../domain/repositories/formula.repository';
import { PROBLEM_REPOSITORY } from '../../domain/repositories/problem.repository';
import type { ProblemRepository } from '../../domain/repositories/problem.repository';
import { PERFORMANCE_TABLE_REPOSITORY } from '@/performance-tables/domain/repositories/performance-table.repository';
import type { PerformanceTableRepository } from '@/performance-tables/domain/repositories/performance-table.repository';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import type { Problem } from '../../domain/entities/problem.entity';
import type { PerformanceTable } from '@/performance-tables/domain/entities/performance-table.entity';

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
    @Inject(PERFORMANCE_TABLE_REPOSITORY) private readonly tables: PerformanceTableRepository,
    private readonly roomAccessService: RoomAccessService,
  ) {}

  async execute(input: GetProblemFormulaInput): Promise<ProblemFormulaOutput> {
    await this.roomAccessService.assertTutorCanAccessRoom(input.roomId, input.tutorId);

    const problem = await this.validateProblem(input);
    const table = await this.fetchTable(problem);

    const criteriaMap = new Map<string, string>();
    if (table) {
      table.criteria.forEach((c) => criteriaMap.set(c.id, c.name));
    }

    const activeFormula = await this.formulas.findActiveByProblemAndScope(
      input.problemId,
      input.scope,
    );
    if (activeFormula) {
      return this.buildActiveFormula(input.scope, activeFormula, criteriaMap);
    }

    return this.buildDefaultFormula(input.scope, table);
  }

  private async validateProblem(input: GetProblemFormulaInput): Promise<Problem> {
    const problem = await this.problems.findById(input.problemId);
    if (!problem || problem.roomId !== input.roomId) {
      throw new NotFoundError('Problema não encontrado na sala informada.');
    }
    return problem;
  }

  private async fetchTable(problem: Problem) {
    if (!problem.performanceTableId) return null;
    return this.tables.findByIdIncludingDeleted(problem.performanceTableId);
  }

  private buildActiveFormula(
    scope: FormulaScope,
    activeFormula: Formula,
    criteriaMap: Map<string, string>,
  ): ProblemFormulaOutput {
    return {
      scope,
      isDefault: false,
      version: activeFormula.version,
      components: activeFormula.components.map((c) => ({
        type: c.type,
        referenceId: c.referenceId,
        name: c.referenceId
          ? criteriaMap.get(c.referenceId) || 'Critério Excluído'
          : this.getDefaultNameForType(c.type),
        weight: Number(c.weight),
      })),
    };
  }

  private buildDefaultFormula(
    scope: FormulaScope,
    table: PerformanceTable | null,
  ): ProblemFormulaOutput {
    if (scope === FormulaScope.PROBLEMA) {
      return this.buildProblemScopeFormula();
    }
    return this.buildSessionScopeFormula(table);
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

  private buildSessionScopeFormula(table: PerformanceTable | null): ProblemFormulaOutput {
    if (!table || table.criteria.length === 0) {
      throw new UnprocessableEntityError(
        'O problema não possui uma tabela de desempenho com critérios.',
      );
    }

    const components = this.createCriteriaComponents(table);
    this.adjustComponentWeights(components);

    return {
      scope: FormulaScope.SESSAO,
      isDefault: true,
      version: null,
      components,
    };
  }

  private createCriteriaComponents(table: {
    criteria: Array<{ id: string; name: string; weight: string | number }>;
  }) {
    const totalWeight = table.criteria.reduce((sum, c) => sum + Number(c.weight), 0);
    return table.criteria.map((c) => ({
      type: FormulaComponentType.CRITERIO as const,
      referenceId: c.id,
      name: c.name,
      weight: Number(((Number(c.weight) / totalWeight) * 100).toFixed(2)),
    }));
  }

  private adjustComponentWeights(components: Array<{ weight: number }>): void {
    const sum = components.reduce((acc: number, c) => acc + c.weight, 0);
    if (sum !== 100 && components.length > 0) {
      const lastComponent = components[components.length - 1];
      if (lastComponent) {
        lastComponent.weight += Number((100 - sum).toFixed(2));
        lastComponent.weight = Number(lastComponent.weight.toFixed(2));
      }
    }
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
