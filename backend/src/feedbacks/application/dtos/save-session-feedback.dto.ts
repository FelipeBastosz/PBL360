import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class SaveSessionFeedbackDto {
  @ApiProperty({
    description:
      'Texto do feedback direcionado ao aluno na sessão (0 a 2000 caracteres; vazio remove o feedback existente).',
    example: 'Boa condução dos debates durante a primeira sessão.',
    minLength: 0,
    maxLength: 2000,
  })
  @IsString({ message: 'O texto do feedback deve ser uma cadeia de caracteres.' })
  @MaxLength(2000, { message: 'O texto do feedback deve ter no máximo 2000 caracteres.' })
  texto!: string;
}
