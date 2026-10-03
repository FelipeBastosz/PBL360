import { ApiProperty } from '@nestjs/swagger';

export class FeedbackRevisionResponseDto {
  @ApiProperty({ example: 8.5, nullable: true })
  nota: number | null;

  @ApiProperty({ example: 'Texto anterior do feedback antes da alteração.' })
  texto: string;

  @ApiProperty({ example: 'Carlos Professor' })
  editadoPor: string;

  @ApiProperty({ example: '2026-10-02T20:30:00.000Z' })
  editadoEm: Date;
}
