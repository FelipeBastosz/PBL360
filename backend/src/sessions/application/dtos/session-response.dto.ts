import { ApiProperty } from '@nestjs/swagger';

export class SessionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Introdução ao problema' })
  titulo: string;

  @ApiProperty({ example: 'Material de preparação.', nullable: true })
  descricao: string | null;

  @ApiProperty({ example: '2026-10-15', format: 'date' })
  data: string;

  @ApiProperty({ example: 1 })
  ordem: number;

  @ApiProperty({ example: 'agendada' })
  status: string;
}

export class SessionDetailResponseDto extends SessionResponseDto {
  @ApiProperty({ format: 'uuid' })
  problemaId: string;

  @ApiProperty({ format: 'uuid' })
  salaId: string;
}

export class SessionCreatedResponseDto extends SessionResponseDto {
  @ApiProperty({ format: 'uuid' })
  problemaId: string;
}
