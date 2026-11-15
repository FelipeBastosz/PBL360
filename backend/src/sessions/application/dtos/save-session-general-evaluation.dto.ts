import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength } from 'class-validator';

export class SaveSessionGeneralEvaluationDto {
  @ApiProperty({
    description: 'Relato geral sobre a sessão (de 1 a 2000 caracteres).',
    example: 'A turma debateu as hipóteses e definiu os próximos passos.',
    maxLength: 2000,
  })
  @IsString({ message: 'O texto deve ser uma cadeia de caracteres.' })
  @Matches(/\S/, { message: 'O texto não pode estar vazio.' })
  @MaxLength(2000, { message: 'O texto deve ter no máximo 2000 caracteres.' })
  texto!: string;
}
