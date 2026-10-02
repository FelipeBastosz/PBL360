import { ApiProperty } from '@nestjs/swagger';

export class SessionFeedbackResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'SESSAO', enum: ['SESSAO'] })
  escopo: 'SESSAO';

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  sessaoId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002' })
  destinatarioId: string;

  @ApiProperty({ example: 'Bom desempenho e participação na sessão.' })
  texto: string;

  @ApiProperty({ example: '2026-10-02T20:00:00.000Z' })
  criadoEm: Date;

  @ApiProperty({ example: null, nullable: true })
  editadoEm: Date | null;
}
