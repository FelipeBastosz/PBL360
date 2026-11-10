import { ApiProperty } from '@nestjs/swagger';
import { SessionDetailResponseDto } from './session-response.dto';

export class MemberSessionResponseDto extends SessionDetailResponseDto {
  @ApiProperty({ example: 'Sistema de biblioteca' })
  problemaTitulo: string;
}

export class RoomSessionResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ example: 'Abertura do problema' }) titulo: string;
  @ApiProperty({ example: '15-10-2026', pattern: '^\\d{2}-\\d{2}-\\d{4}$' }) data: string;
  @ApiProperty({ example: 1 }) ordem: number;
  @ApiProperty({ example: 'agendada' }) status: string;
  @ApiProperty({ format: 'uuid' }) problemaId: string;
  @ApiProperty({ example: 'Sistema de biblioteca' }) problemaTitulo: string;
}
