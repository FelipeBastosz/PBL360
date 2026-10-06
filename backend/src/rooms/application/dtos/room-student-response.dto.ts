import { ApiProperty } from '@nestjs/swagger';

export class RoomStudentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  nome!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  dataEntrada!: Date;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty()
  matricula!: string;
}
