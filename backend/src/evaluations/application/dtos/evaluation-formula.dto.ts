import { ApiProperty } from '@nestjs/swagger';

export class EvaluationFormulaDto {
  @ApiProperty({ example: 70, description: 'Peso dos critérios no cálculo da média final.' })
  criteriaWeight!: number;

  @ApiProperty({ example: 30, description: 'Peso do cargo no cálculo da média final.' })
  roleWeight!: number;
}
