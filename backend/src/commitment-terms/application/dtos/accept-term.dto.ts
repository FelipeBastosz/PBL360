import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AcceptTermDto {
  @ApiProperty({
    example: '1.1',
    description: 'Versão do termo de compromisso que está sendo aceita.',
  })
  @IsString({ message: 'A versão deve ser um texto.' })
  @IsNotEmpty({ message: 'A versão não pode ser vazia.' })
  versao: string;
}
