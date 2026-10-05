import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError, UnprocessableEntityError } from '@/shared/errors/application.error';
import { FormulaScope } from '../../domain/entities/formula.entity';
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

    const activeFormula = await this.formulas.findActiveByProblemAndScope(input.problemId, input.scope);
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

  private buildActiveFormula(scope: FormulaScope, activeFormula: any, criteriaMap: Map<string, string>): FormulaResponseDto {
    return {
      escopo: scope,
      padrao: false,
      versao: activeFormula.version,
      componentes: activeFormula.components.map((c: any) => ({
        tipo: c.type,
        referenciaId: c.referenceId,
        nome: c.referenceId ? (criteriaMap.get(c.referenceId) || 'Critério Excluído') : this.getDefaultNameForType(c.type),
        peso: Number(c.weight),
      })),
    };
  }

  private buildDefaultFormula(scope: FormulaScope, table: any): FormulaResponseDto {
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
      componentes: [
        { tipo: FormulaComponentType.MEDIA_SESSOES, referenciaId: null, nome: 'Média das Sessões', peso: 100 },
        { tipo: FormulaComponentType.AUTOAVALIACAO, referenciaId: null, nome: 'Autoavaliação', peso: 0 },
        { tipo: FormulaComponentType.PARES, referenciaId: null, nome: 'Avaliação por Pares', peso: 0 },
      ],
    };
  }

  private buildSessionScopeFormula(table: any): FormulaResponseDto {
    if (!table || table.criteria.length === 0) {
      throw new UnprocessableEntityError('O problema não possui uma tabela de desempenho com critérios.');
    }

    const totalWeight = table.criteria.reduce((sum: number, c: any) => sum + Number(c.weight), 0);
    const componentes = table.criteria.map((c: any) => ({
      tipo: FormulaComponentType.CRITERIO,
      referenciaId: c.id,
      nome: c.name,
      peso: Number(((Number(c.weight) / totalWeight) * 100).toFixed(2)),
    }));

    const sum = componentes.reduce((acc: number, c: any) => acc + c.peso, 0);
    if (sum !== 100 && componentes.length > 0) {
      componentes[componentes.length - 1].peso += Number((100 - sum).toFixed(2));
      componentes[componentes.length - 1].peso = Number(componentes[componentes.length - 1].peso.toFixed(2));
    }

    return {
      escopo: FormulaScope.SESSAO,
      padrao: true,
      versao: null,
      componentes,
    };
  }

  private getDefaultNameForType(type: string): string | null {
    switch (type) {
      case FormulaComponentType.MEDIA_SESSOES: return 'Média das Sessões';
      case FormulaComponentType.AUTOAVALIACAO: return 'Autoavaliação';
      case FormulaComponentType.PARES: return 'Avaliação por Pares';
      default: return null;
    }
  }
}
