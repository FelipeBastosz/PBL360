import { ApiProperty } from '@nestjs/swagger';

export class TutorResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Ana Souza' })
  nome: string;

  @ApiProperty({ example: 'ana@uefs.br' })
  email: string;
}
