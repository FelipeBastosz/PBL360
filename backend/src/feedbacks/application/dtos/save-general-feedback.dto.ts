import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SaveGeneralFeedbackDto {
  @ApiPropertyOptional({ example: 'PROBLEMA' })
  @IsOptional()
  @IsString()
  escopo?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  destinatario_id?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  destinatarioId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  nota?: number | null;

  @ApiProperty({
    description:
      'Texto do feedback geral sobre o problema (0 a 2000 caracteres; vazio remove o feedback existente).',
    example: 'A turma como um todo evoluiu bem na formulação das hipóteses.',
    minLength: 0,
    maxLength: 2000,
  })
  @IsString({ message: 'O texto do feedback deve ser uma cadeia de caracteres.' })
  @MaxLength(2000, { message: 'O texto do feedback deve ter no máximo 2000 caracteres.' })
  texto!: string;
}
