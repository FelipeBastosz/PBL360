import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { EvaluationItemDto } from './evaluation-item.dto';

export class SaveTutorEvaluationDto {
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
    description:
      'Notas por critério. Ao enviar, todos os critérios exigidos devem estar preenchidos.',
  })
  @IsArray({ message: 'Os itens da avaliação devem ser uma lista.' })
  @ValidateNested({ each: true })
  @Type(() => EvaluationItemDto)
  itens!: EvaluationItemDto[];

  @ApiProperty({
    example: false,
    description: 'False salva o rascunho; true envia a avaliação.',
  })
  @IsBoolean({ message: 'O campo enviar deve ser um booleano.' })
  enviar!: boolean;

  @ApiPropertyOptional({
    minLength: 10,
    maxLength: 500,
    description: 'Obrigatória quando alguma nota de uma avaliação já enviada for alterada.',
  })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString({ message: 'A justificativa deve ser um texto.' })
  @Length(10, 500, {
    message: 'A justificativa deve ter entre 10 e 500 caracteres.',
  })
  justificativa?: string;
}
