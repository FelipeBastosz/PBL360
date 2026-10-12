import { ApiProperty } from '@nestjs/swagger';

export class RoomStudentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  nome!: string;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty({ nullable: true })
  matricula!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  dataEntrada!: Date;
}
