import type { TeacherFormulaDto } from '../../application/dtos/teacher-formula.dto';
import type { TeacherFormulaOutput } from '../../application/use-cases/get-teacher-formula.use-case';

export function toTeacherFormulaResponse(output: TeacherFormulaOutput): TeacherFormulaDto {
  return {
    ...(output.id ? { id: output.id } : {}),
    escopo: output.scope,
    padrao: output.isDefault,
    versao: output.version,
    componentes: output.components.map((c) => ({
      tipo: c.type,
      peso: c.weight,
    })),
  };
}
