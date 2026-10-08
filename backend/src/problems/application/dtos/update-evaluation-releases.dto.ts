import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsISO8601, IsObject, IsOptional, ValidateNested } from 'class-validator';

export class EvaluationReleaseDto {
  @ApiProperty({
    example: true,
    description: 'True libera os envios; false bloqueia novos envios.',
  })
  @IsBoolean({ message: 'O campo liberada deve ser um booleano.' })
  liberada!: boolean;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    nullable: true,
    example: '2026-12-01T23:59:00.000Z',
    description: 'Instante ISO 8601 no futuro, ou null para sem prazo.',
  })
  @IsOptional()
  @IsISO8601({ strict: true }, { message: 'O prazo deve ser uma data ISO 8601 válida.' })
  prazo?: string | null;
}

export class UpdateEvaluationReleasesDto {
  @ApiPropertyOptional({ type: EvaluationReleaseDto })
  @IsOptional()
  @IsObject({ message: 'A autoavaliação deve ser um objeto.' })
  @ValidateNested()
  @Type(() => EvaluationReleaseDto)
  autoavaliacao?: EvaluationReleaseDto;

  @ApiPropertyOptional({ type: EvaluationReleaseDto })
  @IsOptional()
  @IsObject({ message: 'A avaliação entre pares deve ser um objeto.' })
  @ValidateNested()
  @Type(() => EvaluationReleaseDto)
  pares?: EvaluationReleaseDto;
}
