import { ApiProperty } from '@nestjs/swagger';

export class SessionListResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Introdução ao problema' })
  titulo: string;

  @ApiProperty({ example: 'Material de preparação.', nullable: true })
  descricao: string | null;

  @ApiProperty({ example: '15-10-2026', pattern: '^\\d{2}-\\d{2}-\\d{4}$' })
  data: string;

  @ApiProperty({ example: 1 })
  ordem: number;

  @ApiProperty({ example: 'agendada' })
  status: string;
}

export class SessionDetailResponseDto extends SessionListResponseDto {
  @ApiProperty({ format: 'uuid' })
  problemaId: string;

  @ApiProperty({ format: 'uuid' })
  salaId: string;
}

export class SessionCreatedResponseDto extends SessionListResponseDto {
  @ApiProperty({ format: 'uuid' })
  problemaId: string;
}
