import { ApiProperty } from '@nestjs/swagger';

export class FeedbackAuthorDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  nome!: string;
}

export class ReceivedFeedbackResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: FeedbackAuthorDto })
  autor!: FeedbackAuthorDto;

  @ApiProperty()
  texto!: string;

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
