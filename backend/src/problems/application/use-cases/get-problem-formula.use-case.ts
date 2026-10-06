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
import { FormulaResponseDto } from '../dtos/formula-response.dto';
import type { Problem } from '../../domain/entities/problem.entity';
import type { PerformanceTable } from '@/performance-tables/domain/entities/performance-table.entity';

interface Input {
  roomId: string;
  problemId: string;
  tutorId: string;
  scope: FormulaScope;
}

@Injectable()
export class GetProblemFormulaUseCase {
  constructor(
    @Inject(PROBLEM_REPOSITORY) private readonly problems: ProblemRepository,
    @Inject(FORMULA_REPOSITORY) private readonly formulas: FormulaRepository,
    @Inject(PERFORMANCE_TABLE_REPOSITORY) private readonly tables: PerformanceTableRepository,
    private readonly roomAccessService: RoomAccessService,
  ) {}

  async execute(input: Input): Promise<FormulaResponseDto> {
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

  private async validateProblem(input: Input): Promise<Problem> {
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
  ): FormulaResponseDto {
    return {
      escopo: scope,
      padrao: false,
      versao: activeFormula.version,
      componentes: activeFormula.components.map((c) => ({
        tipo: c.type,
        referenciaId: c.referenceId,
        nome: c.referenceId
          ? criteriaMap.get(c.referenceId) || 'Critério Excluído'
          : this.getDefaultNameForType(c.type),
        peso: Number(c.weight),
      })),
    };
  }

  private buildDefaultFormula(
    scope: FormulaScope,
    table: PerformanceTable | null,
  ): FormulaResponseDto {
    if (scope === FormulaScope.PROBLEMA) {
      return this.buildProblemScopeFormula();
    }
    return this.buildSessionScopeFormula(table);
  }

  private buildProblemScopeFormula(): FormulaResponseDto {
    return {
      escopo: FormulaScope.PROBLEMA,
      padrao: true,
      versao: null,
      componentes: this.getProblemScopeComponents(),
    };
  }

  private getProblemScopeComponents() {
    return [
      this.createComponent(FormulaComponentType.MEDIA_SESSOES, 'Média das Sessões', 100),
      this.createComponent(FormulaComponentType.AUTOAVALIACAO, 'Autoavaliação', 0),
      this.createComponent(FormulaComponentType.PARES, 'Avaliação por Pares', 0),
    ];
  }

  private createComponent(tipo: string, nome: string, peso: number) {
    return { tipo, referenciaId: null, nome, peso };
  }

  private buildSessionScopeFormula(table: PerformanceTable | null): FormulaResponseDto {
    if (!table || table.criteria.length === 0) {
      throw new UnprocessableEntityError(
        'O problema não possui uma tabela de desempenho com critérios.',
      );
    }

    const componentes = this.createCriteriaComponents(table);
    this.adjustComponentWeights(componentes);

    return {
      escopo: FormulaScope.SESSAO,
      padrao: true,
      versao: null,
      componentes,
    };
  }

  private createCriteriaComponents(table: {
    criteria: Array<{ id: string; name: string; weight: string | number }>;
  }) {
    const totalWeight = table.criteria.reduce((sum, c) => sum + Number(c.weight), 0);
    return table.criteria.map((c) => ({
      tipo: FormulaComponentType.CRITERIO as const,
      referenciaId: c.id,
      nome: c.name,
      peso: Number(((Number(c.weight) / totalWeight) * 100).toFixed(2)),
    }));
  }

  private adjustComponentWeights(componentes: Array<{ peso: number }>): void {
    const sum = componentes.reduce((acc: number, c) => acc + c.peso, 0);
    if (sum !== 100 && componentes.length > 0) {
      componentes[componentes.length - 1].peso += Number((100 - sum).toFixed(2));
      componentes[componentes.length - 1].peso = Number(
        componentes[componentes.length - 1].peso.toFixed(2),
      );
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
