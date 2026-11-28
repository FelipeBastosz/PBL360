import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class SaveSessionGeneralEvaluationDto {
  @ApiProperty({
    description:
      'Relato geral sobre a sessão (0 a 2000 caracteres; vazio remove a avaliação existente).',
    example: 'A turma debateu as hipóteses e definiu os próximos passos.',
    minLength: 0,
    maxLength: 2000,
  })
  @IsString({ message: 'O texto deve ser uma cadeia de caracteres.' })
  @MaxLength(2000, { message: 'O texto deve ter no máximo 2000 caracteres.' })
  texto!: string;
}
