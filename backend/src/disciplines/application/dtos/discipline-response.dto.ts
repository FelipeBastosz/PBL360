import { ApiProperty } from '@nestjs/swagger';

export class DisciplineResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'EXA863' })
  codigo: string;

  @ApiProperty({ example: 'MI Programação' })
  nome: string;
}
