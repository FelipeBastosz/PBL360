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
}

export class ReceivedIndividualFeedbackResponseDto extends ReceivedFeedbackResponseDto {
  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Nota opcional do feedback individual do problema.',
  })
  nota!: number | null;
}
