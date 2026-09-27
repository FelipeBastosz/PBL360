import { ApiProperty } from '@nestjs/swagger';

export class ProblemDeletionImpactDto {
  @ApiProperty({
    example: 0,
    description: 'Quantidade de sessões vinculadas ao problema.',
  })
  sessoes: number;

  @ApiProperty({
    example: 0,
    description: 'Quantidade de notas vinculadas ao problema.',
  })
  notas: number;

  @ApiProperty({
    example: 0,
    description: 'Quantidade de feedbacks vinculados ao problema.',
  })
  feedbacks: number;

  @ApiProperty({
    example: 0,
    description: 'Quantidade de avaliações vinculadas ao problema.',
  })
  avaliacoes: number;
}
