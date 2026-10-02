import { ApiProperty } from '@nestjs/swagger';

export class StudentProblemFeedbackResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'ALUNO', enum: ['ALUNO'] })
  escopo: 'ALUNO';

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  destinatarioId: string;

  @ApiProperty({ example: 8.5, nullable: true })
  nota: number | null;

  @ApiProperty({ example: 'Excelente participação na tutoria.' })
  texto: string;

  @ApiProperty({ example: '2026-10-02T20:00:00.000Z' })
  criadoEm: Date;

  @ApiProperty({ example: null, nullable: true })
  editadoEm: Date | null;
}
