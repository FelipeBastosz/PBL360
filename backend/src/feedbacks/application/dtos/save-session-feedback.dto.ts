import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class SaveSessionFeedbackDto {
  @ApiProperty({
    description: 'Texto do feedback direcionado ao aluno na sessão (até 2000 caracteres).',
    example: 'Boa condução dos debates durante a primeira sessão.',
    maxLength: 2000,
  })
  @IsString({ message: 'O texto do feedback deve ser uma cadeia de caracteres.' })
  @MaxLength(2000, { message: 'O texto do feedback deve ter no máximo 2000 caracteres.' })
  texto!: string;
}
