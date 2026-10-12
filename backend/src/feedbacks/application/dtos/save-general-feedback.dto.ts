import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

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
    description: 'Texto do feedback geral sobre o problema (1 a 2000 caracteres).',
    example: 'A turma como um todo evoluiu bem na formulação das hipóteses.',
    minLength: 1,
    maxLength: 2000,
  })
  @IsNotEmpty({ message: 'O texto do feedback é obrigatório.' })
  @IsString({ message: 'O texto do feedback deve ser uma cadeia de caracteres.' })
  @Length(1, 2000, { message: 'O texto do feedback deve ter entre 1 e 2000 caracteres.' })
  texto!: string;
}
