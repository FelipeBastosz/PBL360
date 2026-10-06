import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ComplementObservationDto {
  @ApiProperty({ example: 'Usou o celular duas vezes durante a discussão.', maxLength: 1000 })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'O texto da observação é obrigatório.' })
  @MaxLength(1000, { message: 'O texto deve ter no máximo 1000 caracteres.' })
  texto: string;
}
