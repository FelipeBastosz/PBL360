import { IsEnum } from 'class-validator';
import { FormulaScope } from '../../domain/entities/formula.entity';

export class RestoreDefaultFormulaDto {
  @IsEnum(FormulaScope, { message: 'O escopo deve ser SESSAO ou PROBLEMA.' })
  escopo!: FormulaScope;
}
