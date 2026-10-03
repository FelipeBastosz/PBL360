import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class SaveSessionFeedbackDto {
  @ApiProperty({
    description: 'Texto do feedback direcionado ao aluno na sessão (1 a 2000 caracteres).',
    example: 'Boa condução dos debates durante a primeira sessão.',
    minLength: 1,
    maxLength: 2000,
  })
  @IsNotEmpty({ message: 'O texto do feedback é obrigatório.' })
  @IsString({ message: 'O texto do feedback deve ser uma cadeia de caracteres.' })
  @Length(1, 2000, { message: 'O texto do feedback deve ter entre 1 e 2000 caracteres.' })
  texto!: string;
}
