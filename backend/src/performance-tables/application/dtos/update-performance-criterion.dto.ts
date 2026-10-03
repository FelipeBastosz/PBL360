import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, ValidateIf } from 'class-validator';
import { CreatePerformanceCriterionDto } from './create-performance-table.dto';

export class UpdatePerformanceCriterionDto extends CreatePerformanceCriterionDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'ID do critério ativo desta tabela. Omita para criar um novo critério.',
  })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsUUID('4', { message: 'O identificador do critério deve ser um UUID válido.' })
  id?: string;
}
