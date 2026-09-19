import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

export class SessionResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  token: string;

  @ApiProperty({ format: 'date-time', example: '2026-09-20T13:45:10.000Z' })
  expiraEm: Date;

  @ApiProperty({ type: UserResponseDto })
  usuario: UserResponseDto;
}
