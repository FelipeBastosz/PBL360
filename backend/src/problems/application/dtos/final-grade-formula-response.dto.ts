import { ApiProperty } from '@nestjs/swagger';

export class FinalGradeSessionWeightResponseDto {
  @ApiProperty({ format: 'uuid' })
  sessaoId!: string;

  @ApiProperty({ example: 'Sessão 1' })
  rotulo!: string;

  @ApiProperty({ example: 1, minimum: 0, maximum: 10, description: 'Peso relativo da sessão.' })
  peso!: number;
}

export class FinalGradeFormulaResponseDto {
  @ApiProperty({ example: true })
  padrao!: boolean;

  @ApiProperty({ example: 2, nullable: true })
  versao!: number | null;

  @ApiProperty({ type: [FinalGradeSessionWeightResponseDto] })
  sessoes!: FinalGradeSessionWeightResponseDto[];
}
