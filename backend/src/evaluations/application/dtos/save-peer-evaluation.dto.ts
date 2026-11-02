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

export class SavePeerEvaluationDto {
  @ApiPropertyOptional({
    minimum: 0,
    maximum: 10,
    nullable: true,
    description: 'Nota do papel desempenhado na sessão, com até uma casa decimal.',
  })
  @IsOptional()
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 1 },
    { message: 'A nota do cargo deve ser um número entre 0 e 10 com até uma casa decimal.' },
  )
  @Min(0, { message: 'A nota do cargo deve ser no mínimo 0.' })
  @Max(10, { message: 'A nota do cargo deve ser no máximo 10.' })
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
    description: 'False salva o rascunho; true envia a avaliação definitivamente.',
  })
  @IsBoolean({ message: 'O campo enviar deve ser um booleano.' })
  enviar!: boolean;
}
