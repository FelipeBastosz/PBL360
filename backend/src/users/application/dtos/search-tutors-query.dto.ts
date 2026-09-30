import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SearchTutorsQueryDto {
  @ApiProperty({ minLength: 3, maxLength: 160, example: 'ana@uefs.br' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'A busca deve ser um texto.' })
  @Length(3, 160, { message: 'A busca deve ter entre 3 e 160 caracteres.' })
  busca: string;
}
