import { ApiProperty } from '@nestjs/swagger';

export class RoomTutorResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Ana Souza' })
  nome: string;

  @ApiProperty({ example: 'ana@uefs.br' })
  email: string;

  @ApiProperty({ example: true })
  responsavel: boolean;
}
