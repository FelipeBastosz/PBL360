import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { EvaluationItemDto } from './evaluation-item.dto';

export class SaveSelfAssessmentDto {
  @ApiPropertyOptional({
    minimum: 0,
    maximum: 10,
    nullable: true,
    description: 'Nota do papel desempenhado na sessão.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  notaCargo?: number | null;

  @ApiProperty({
    type: EvaluationItemDto,
    isArray: true,
    description: 'Lista de notas por critério. Ao enviar, precisa conter todos os critérios.',
  })
  @IsArray({ message: 'Os itens da avaliação devem ser uma lista.' })
  @ValidateNested({ each: true })
  @Type(() => EvaluationItemDto)
  itens!: EvaluationItemDto[];

  @ApiProperty({
    example: false,
    description: 'False salva o rascunho; true envia definitivamente.',
  })
  @IsBoolean({ message: 'O campo enviar deve ser um booleano.' })
  enviar!: boolean;
}
