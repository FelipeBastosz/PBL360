import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import type { AdjustmentTarget } from '../../domain/repositories/self-assessment-adjustment.repository';

export class AdjustSelfAssessmentDto {
  @ApiProperty({
    example: 8.5,
    minimum: 0,
    maximum: 10,
    description:
      'Nova nota da autoavaliação ou pares, com até duas casas decimais. Deve ser diferente da nota vigente.',
  })
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 },
    { message: 'A nova nota deve ser um número com até duas casas decimais.' },
  )
  @Min(0, { message: 'A nova nota mínima é 0.' })
  @Max(10, { message: 'A nova nota máxima é 10.' })
  novaNota!: number;

  @ApiProperty({
    minLength: 10,
    maxLength: 500,
    example: 'Nota revisada após conversa com o aluno sobre os critérios.',
    description: 'Justificativa obrigatória do ajuste, entre 10 e 500 caracteres.',
  })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'A justificativa deve ser um texto.' })
  justificativa!: string;

  @ApiPropertyOptional({
    enum: ['AUTOAVALIACAO', 'PARES'],
    description:
      'Tipo de avaliação a ser ajustada. Se omitido, resolve a modalidade ativa na sessão.',
  })
  @IsOptional()
  @IsIn(['AUTOAVALIACAO', 'PARES'], {
    message: 'O tipo deve ser AUTOAVALIACAO ou PARES.',
  })
  tipo?: AdjustmentTarget;
}
