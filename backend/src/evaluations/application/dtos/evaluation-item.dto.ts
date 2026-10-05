import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsUUID } from 'class-validator';

export class EvaluationItemDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador do critério avaliado.',
  })
  @IsUUID('4', {
    message: 'O identificador do critério deve ser um UUID válido.',
  })
  criterioId!: string;

  @ApiProperty({
    example: 8.5,
    minimum: 0,
    maximum: 10,
    description: 'Nota do critério, com até duas casas decimais.',
  })
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 },
    { message: 'A nota deve ser um número com até duas casas decimais.' },
  )
  nota!: number;
}
