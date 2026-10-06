import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class RegisterObservationDto {
  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'Marcações aplicadas. Obrigatório ter ao menos uma quando não houver texto.',
    example: ['8f2c6f18-4b34-4226-9d6f-1a2b3c4d5e6f'],
  })
  @IsOptional()
  @IsArray({ message: 'As marcações devem ser uma lista.' })
  @ArrayUnique({ message: 'As marcações não podem se repetir.' })
  @IsUUID('all', { each: true, message: 'Cada marcação deve ser um UUID válido.' })
  marcacaoIds?: string[];

  @ApiPropertyOptional({ example: 'Chegou 15 minutos atrasado.', maxLength: 1000, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'O texto deve ter no máximo 1000 caracteres.' })
  texto?: string | null;
}
