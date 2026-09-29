import { ApiProperty } from '@nestjs/swagger';

export class StudentRoomResponseDto {
  @ApiProperty({ format: 'uuid' })
  salaId!: string;

  @ApiProperty()
  nome!: string;

  @ApiProperty({ example: '2026.1' })
  semestre!: string;

  @ApiProperty({ example: 24 })
  totalAlunos!: number;
}
