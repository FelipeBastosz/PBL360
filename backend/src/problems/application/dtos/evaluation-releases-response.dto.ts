import { ApiProperty } from '@nestjs/swagger';

export class EvaluationReleaseStatusResponseDto {
  @ApiProperty() liberada!: boolean;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) prazo!: Date | null;
  @ApiProperty({ description: 'Avaliações já enviadas.' }) enviadas!: number;
  @ApiProperty({ description: 'Avaliações esperadas. Em pares, cada aluno avalia cada colega.' })
  esperadas!: number;
}

export class EvaluationReleasesResponseDto {
  @ApiProperty({ type: EvaluationReleaseStatusResponseDto })
  autoavaliacao!: EvaluationReleaseStatusResponseDto;
  @ApiProperty({ type: EvaluationReleaseStatusResponseDto })
  pares!: EvaluationReleaseStatusResponseDto;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) atualizadoEm!: Date | null;
  @ApiProperty({ type: String, format: 'uuid', nullable: true }) atualizadoPor!: string | null;
}
