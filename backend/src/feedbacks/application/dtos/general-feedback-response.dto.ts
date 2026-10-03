import { ApiProperty } from '@nestjs/swagger';

export class GeneralFeedbackResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'PROBLEMA', enum: ['PROBLEMA'] })
  escopo: 'PROBLEMA';

  @ApiProperty({ example: 'Feedback geral consolidado sobre o problema.' })
  texto: string;

  @ApiProperty({ example: '2026-10-02T20:00:00.000Z' })
  criadoEm: Date;

  @ApiProperty({ example: null, nullable: true })
  editadoEm: Date | null;
}
