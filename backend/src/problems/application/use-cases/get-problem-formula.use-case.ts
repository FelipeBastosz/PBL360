import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError, UnprocessableEntityError } from '@/shared/errors/application.error';
import { FormulaScope } from '../../domain/entities/formula.entity';
import { FormulaComponentType } from '../../domain/entities/formula-component.entity';
import { FORMULA_REPOSITORY, type FormulaRepository } from '../../domain/repositories/formula.repository';
import { PROBLEM_REPOSITORY, type ProblemRepository } from '../../domain/repositories/problem.repository';
import { PERFORMANCE_TABLE_REPOSITORY, type PerformanceTableRepository } from '@/performance-tables/domain/repositories/performance-table.repository';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import { FormulaResponseDto } from '../dtos/formula-response.dto';

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

    const problem = await this.problems.findById(input.problemId);
    if (!problem || problem.roomId !== input.roomId) {
      throw new NotFoundError('Problema não encontrado na sala informada.');
    }

    let criteriaMap = new Map<string, string>();
    let table = null;

    if (problem.performanceTableId) {
      table = await this.tables.findByIdIncludingDeleted(problem.performanceTableId);
      if (table) {
        table.criteria.forEach((c) => criteriaMap.set(c.id, c.name));
      }
    }

    const activeFormula = await this.formulas.findActiveByProblemAndScope(input.problemId, input.scope);

    if (activeFormula) {
      return {
        escopo: input.scope,
        padrao: false,
        versao: activeFormula.version,
        componentes: activeFormula.components.map((c) => ({
          tipo: c.type,
          referenciaId: c.referenceId,
          nome: c.referenceId ? (criteriaMap.get(c.referenceId) || 'Critério Excluído') : this.getDefaultNameForType(c.type),
          peso: Number(c.weight),
        })),
      };
    }

    return this.buildDefaultFormula(input.scope, table);
  }

  private buildDefaultFormula(scope: FormulaScope, table: any): FormulaResponseDto {
    if (scope === FormulaScope.PROBLEMA) {
      return {
        escopo: scope,
        padrao: true,
        versao: null,
        componentes: [
          { tipo: FormulaComponentType.MEDIA_SESSOES, referenciaId: null, nome: 'Média das Sessões', peso: 100 },
          { tipo: FormulaComponentType.AUTOAVALIACAO, referenciaId: null, nome: 'Autoavaliação', peso: 0 },
          { tipo: FormulaComponentType.PARES, referenciaId: null, nome: 'Avaliação por Pares', peso: 0 },
        ],
      };
    }

    if (!table || table.criteria.length === 0) {
      throw new UnprocessableEntityError('O problema não possui uma tabela de desempenho com critérios.');
    }

    const totalWeight = table.criteria.reduce((sum, c) => sum + Number(c.weight), 0);
    
    const componentes = table.criteria.map((c) => {
      const rawPeso = totalWeight > 0 ? (Number(c.weight) / totalWeight) * 100 : 100 / table.criteria.length;
      return {
        tipo: FormulaComponentType.CRITERIO,
        referenciaId: c.id,
        nome: c.name,
        peso: Number(rawPeso.toFixed(2)),
      };
    });

    const sum = componentes.reduce((acc, c) => acc + c.peso, 0);
    if (sum !== 100 && componentes.length > 0) {
      componentes[componentes.length - 1].peso += Number((100 - sum).toFixed(2));
      componentes[componentes.length - 1].peso = Number(componentes[componentes.length - 1].peso.toFixed(2));
    }

    return {
      escopo: scope,
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
