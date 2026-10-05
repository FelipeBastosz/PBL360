import { ApiProperty } from '@nestjs/swagger';

export enum EvaluationStatusResponse {
  PENDENTE = 'PENDENTE',
  RASCUNHO = 'RASCUNHO',
  ENVIADA = 'ENVIADA',
}
export class SessionEvaluationSummaryResponseDto {
  @ApiProperty({ format: 'uuid' }) alunoId!: string;
  @ApiProperty() nome!: string;
  @ApiProperty({ example: 'AS' }) iniciais!: string;
  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Indisponível até a integração com chamada; null não significa ausência.',
  })
  presenca!: null;
  @ApiProperty({ enum: EvaluationStatusResponse }) status!: EvaluationStatusResponse;
  @ApiProperty({ type: Number, nullable: true, minimum: 0, maximum: 10 }) notaSessao!:
    number | null;
}
