import type { CustomizeFormulaDto } from '../../application/dtos/customize-formula.dto';
import type { FormulaResponseDto } from '../../application/dtos/formula-response.dto';
import type { CustomizeFormulaComponentInput } from '../../application/use-cases/customize-problem-formula.use-case';
import type { ProblemFormulaOutput } from '../../application/use-cases/get-problem-formula.use-case';

export const toFormulaResponse = (formula: ProblemFormulaOutput): FormulaResponseDto => ({
  escopo: formula.scope,
  padrao: formula.isDefault,
  versao: formula.version,
  componentes: formula.components.map((component) => ({
    tipo: component.type,
    referenciaId: component.referenceId,
    nome: component.name,
    peso: component.weight,
  })),
});

export const toCustomizeFormulaComponents = (
  dto: CustomizeFormulaDto,
): CustomizeFormulaComponentInput[] =>
  dto.componentes.map((component) => ({
    type: component.tipo,
    referenceId: component.referenciaId,
    weight: component.peso,
  }));
