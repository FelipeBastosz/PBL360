import { ApiProperty } from '@nestjs/swagger';

export class EvaluationTableResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'Avaliação tutorial' }) nome!: string;
}
export class EvaluationCriterionResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() nome!: string;
  @ApiProperty({ type: String, nullable: true }) descricao!: string | null;
  @ApiProperty({ example: 1, minimum: 0, maximum: 10 }) peso!: number;
  @ApiProperty({ example: 10, enum: [10] }) notaMaxima!: number;
  @ApiProperty({ minimum: 1 }) ordem!: number;
}
export class ProblemEvaluationCriteriaResponseDto {
  @ApiProperty({ type: EvaluationTableResponseDto }) tabela!: EvaluationTableResponseDto;
  @ApiProperty({ type: [EvaluationCriterionResponseDto] })
  criterios!: EvaluationCriterionResponseDto[];
}
