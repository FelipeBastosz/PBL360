import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateProblemDto {
  @IsString({ message: 'O título do problema deve ser um texto.' })
  @IsNotEmpty({ message: 'O título do problema não pode ser vazio.' })
  @MaxLength(200, { message: 'O título do problema deve ter no máximo 200 caracteres.' })
  title!: string;
}
