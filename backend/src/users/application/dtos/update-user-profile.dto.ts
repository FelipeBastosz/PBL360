import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class UpdateUserProfileDto {
  @ApiProperty({ minLength: 3, maxLength: 120, example: 'Ana Souza' })
  @IsString({ message: 'O nome é obrigatório.' })
  @Length(3, 120, { message: 'O nome deve ter entre 3 e 120 caracteres.' })
  nome!: string;
}
