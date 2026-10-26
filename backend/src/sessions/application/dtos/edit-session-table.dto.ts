import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  Allow,
  IsArray,
  IsIn,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import type { TableEditScope } from '../../domain/repositories/session-table-editing.repository';

export class EditSessionCriterionDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Obrigatório quando somente pesos podem mudar.',
  })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsUUID('4', { message: 'O identificador do critério é inválido.' })
  id?: string;

  @ApiPropertyOptional({ maxLength: 120, description: 'Obrigatório na edição completa.' })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString({ message: 'O nome do critério deve ser um texto.' })
  @MaxLength(120)
  nome?: string;

  @ApiProperty({
    minimum: 0,
    maximum: 10,
    description: 'Até duas casas decimais. A soma dos pesos deve ser 10.',
  })
  @Allow()
  peso: number;
}

export class EditSessionTableDto {
  @ApiProperty({ enum: ['SESSAO', 'TODAS'] })
  @IsIn(['SESSAO', 'TODAS'], { message: 'O escopo deve ser SESSAO ou TODAS.' })
  escopo: TableEditScope;

  @ApiPropertyOptional({ maxLength: 120, description: 'Aceito somente na edição completa.' })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString({ message: 'O nome da tabela deve ser um texto.' })
  @MaxLength(120)
  nome?: string;

  @ApiProperty({ type: EditSessionCriterionDto, isArray: true })
  @IsArray({ message: 'Os critérios devem ser uma lista.' })
  @ValidateNested({ each: true })
  @Type(() => EditSessionCriterionDto)
  criterios: EditSessionCriterionDto[];
}
