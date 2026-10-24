import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateDisciplineDto {
  @ApiProperty({ example: 'EXA999', pattern: '^[A-Za-z]{3}[0-9]{3}$' })
  @Transform(trim)
  @IsString({ message: 'O código da disciplina deve ser um texto.' })
  @IsNotEmpty({ message: 'O código da disciplina é obrigatório.' })
  @Matches(/^[A-Za-z]{3}[0-9]{3}$/, {
    message: 'O código da disciplina deve seguir o formato ABC123.',
  })
  codigo: string;

  @ApiProperty({ example: 'MI Nova Disciplina', minLength: 1, maxLength: 120 })
  @Transform(trim)
  @IsString({ message: 'O nome da disciplina deve ser um texto.' })
  @IsNotEmpty({ message: 'O nome da disciplina é obrigatório.' })
  @MaxLength(120, { message: 'O nome da disciplina deve ter no máximo 120 caracteres.' })
  nome: string;
}
