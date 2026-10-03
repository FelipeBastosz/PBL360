import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UpdatePerformanceCriterionDto } from './update-performance-criterion.dto';

export class UpdatePerformanceTableDto {
  @ApiProperty({ example: 'Barema PBL atualizado', maxLength: 120 })
  @IsString()
  @IsNotEmpty({ message: 'O nome da tabela de desempenho é obrigatório.' })
  @MaxLength(120)
  nome: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'Critérios atualizados para as próximas avaliações.',
  })
  @IsOptional()
  @IsString()
  descricao?: string | null;

  @ApiProperty({
    type: UpdatePerformanceCriterionDto,
    isArray: true,
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1, {
    message: 'A tabela de desempenho deve possuir ao menos um critério.',
  })
  @ValidateNested({ each: true })
  @Type(() => UpdatePerformanceCriterionDto)
  criterios: UpdatePerformanceCriterionDto[];
}
