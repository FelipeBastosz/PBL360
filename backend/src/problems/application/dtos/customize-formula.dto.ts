import { IsArray, IsEnum, IsNumber, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FormulaScope } from '../../domain/entities/formula.entity';
import { FormulaComponentType } from '../../domain/entities/formula-component.entity';

export class CustomizeFormulaComponentDto {
  @IsEnum(FormulaComponentType, { message: 'O tipo de componente é inválido.' })
  tipo!: string;

  @IsOptional()
  @IsUUID('4', { message: 'O ID de referência deve ser um UUID válido.' })
  referenciaId?: string | null;

  @IsNumber({}, { message: 'O peso deve ser numérico.' })
  peso!: number;
}

export class CustomizeFormulaDto {
  @IsEnum(FormulaScope, { message: 'O escopo da fórmula deve ser SESSAO ou PROBLEMA.' })
  escopo!: FormulaScope;

  @IsArray({ message: 'Os componentes devem ser uma lista.' })
  @ValidateNested({ each: true })
  @Type(() => CustomizeFormulaComponentDto)
  componentes!: CustomizeFormulaComponentDto[];
}
