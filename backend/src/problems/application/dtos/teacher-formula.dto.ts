import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { FormulaScope } from '../../domain/entities/formula.entity';
import { FormulaComponentType } from '../../domain/entities/formula-component.entity';

export class TeacherFormulaComponentDto {
  @ApiProperty({ example: 'CRITERIOS' })
  tipo: string;

  @ApiProperty({ example: 70 })
  peso: number;
}

export class TeacherFormulaDto {
  @ApiPropertyOptional({ format: 'uuid' })
  id?: string;

  @ApiProperty({ enum: FormulaScope, example: FormulaScope.PROFESSOR })
  escopo: FormulaScope;

  @ApiProperty({ example: true })
  padrao: boolean;

  @ApiProperty({ nullable: true, example: 1 })
  versao: number | null;

  @ApiProperty({ type: [TeacherFormulaComponentDto] })
  componentes: TeacherFormulaComponentDto[];
}

export class UpdateTeacherFormulaComponentDto {
  @ApiProperty({ enum: FormulaComponentType, example: FormulaComponentType.CRITERIOS })
  @IsEnum(FormulaComponentType, { message: 'O tipo de componente é inválido.' })
  tipo: string;

  @ApiProperty({ example: 70, minimum: 0, maximum: 100 })
  @IsNumber({}, { message: 'O peso deve ser numérico.' })
  @Min(0, { message: 'O peso deve estar entre 0 e 100.' })
  @Max(100, { message: 'O peso deve estar entre 0 e 100.' })
  peso: number;
}

export class UpdateTeacherFormulaDto {
  @ApiPropertyOptional({ enum: FormulaScope, example: FormulaScope.PROFESSOR })
  @IsOptional()
  @IsEnum(FormulaScope, { message: 'O escopo da fórmula é inválido.' })
  escopo?: FormulaScope;

  @ApiProperty({ type: [UpdateTeacherFormulaComponentDto] })
  @IsArray({ message: 'Os componentes devem ser uma lista.' })
  @ArrayMinSize(1, { message: 'Informe os componentes da fórmula.' })
  @ValidateNested({ each: true })
  @Type(() => UpdateTeacherFormulaComponentDto)
  componentes: UpdateTeacherFormulaComponentDto[];
}
