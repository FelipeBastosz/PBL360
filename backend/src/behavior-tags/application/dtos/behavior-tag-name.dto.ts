import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class BehaviorTagNameDto {
  @ApiProperty({ example: 'Liderou o grupo', minLength: 1, maxLength: 80 })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'O nome da marcação é obrigatório.' })
  @MaxLength(80, { message: 'O nome da marcação deve ter no máximo 80 caracteres.' })
  nome: string;
}
