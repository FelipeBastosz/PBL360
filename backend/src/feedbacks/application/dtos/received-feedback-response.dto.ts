import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FeedbackAuthorDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  nome!: string;
}

export class ReceivedComponentGradeDto {
  @ApiProperty({ type: Number, nullable: true })
  nota!: number | null;

  @ApiProperty()
  situacao!: string;

  @ApiPropertyOptional({ enum: ['FORMULARIO', 'PLANNING_POKER'] })
  origem?: 'FORMULARIO' | 'PLANNING_POKER';
}

export class ReceivedSessionComponentsDto {
  @ApiProperty({ enum: ['AUTOAVALIACAO', 'PARES'] })
  modalidade!: 'AUTOAVALIACAO' | 'PARES';

  @ApiProperty({ type: ReceivedComponentGradeDto, nullable: true })
  autoavaliacao!: ReceivedComponentGradeDto | null;

  @ApiProperty({ type: ReceivedComponentGradeDto, nullable: true })
  pares!: ReceivedComponentGradeDto | null;
}

export class ReceivedFeedbackResponseDto {
  @ApiProperty({ format: 'uuid', nullable: true })
  id!: string | null;

  @ApiProperty({ type: FeedbackAuthorDto })
  autor!: FeedbackAuthorDto;

  @ApiProperty({ type: String, nullable: true })
  texto!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  criadoEm!: Date;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  editadoEm!: Date | null;

  @ApiProperty({
    description: 'Verdadeiro na requisição que registra a primeira leitura; falso nas seguintes.',
  })
  novo!: boolean;

  @ApiProperty({
    type: Number,
    nullable: true,
    description:
      'Nota associada, disponível após o envio da avaliação do tutor para o aluno. Nula antes da liberação ou quando não houver nota.',
  })
  nota!: number | null;

  @ApiPropertyOptional({
    type: ReceivedSessionComponentsDto,
    description: 'Notas de autoavaliação e de pares (formulário ou Planning Poker) da sessão.',
  })
  avaliacoes?: ReceivedSessionComponentsDto;
}

export class ReceivedIndividualFeedbackResponseDto extends ReceivedFeedbackResponseDto {
  @ApiProperty({
    type: Number,
    nullable: true,
    description:
      'Nota opcional do feedback individual. Nula enquanto não houver avaliação do tutor enviada para o aluno no problema.',
  })
  override nota!: number | null;
}
