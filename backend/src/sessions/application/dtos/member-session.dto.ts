import { ApiProperty } from '@nestjs/swagger';
import { SessionDetailResponseDto } from './session-response.dto';

export class MemberSessionResponseDto extends SessionDetailResponseDto {
  @ApiProperty({ example: 'Sistema de biblioteca' })
  problemaTitulo: string;
}

export class RoomSessionResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ example: 'Abertura do problema' }) titulo: string;
  @ApiProperty({ example: '2026-10-15', format: 'date' }) data: string;
  @ApiProperty({ example: 1 }) ordem: number;
  @ApiProperty({ example: 'agendada' }) status: string;
  @ApiProperty({ format: 'uuid' }) problemaId: string;
  @ApiProperty({ example: 'Sistema de biblioteca' }) problemaTitulo: string;
}
