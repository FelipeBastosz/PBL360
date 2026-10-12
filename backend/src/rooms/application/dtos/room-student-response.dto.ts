import { ApiProperty } from '@nestjs/swagger';

export class RoomStudentResponseDto {
  @ApiProperty()
  nome!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  dataEntrada!: Date;
}
