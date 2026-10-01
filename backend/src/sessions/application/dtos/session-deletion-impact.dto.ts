import { ApiProperty } from '@nestjs/swagger';

export class SessionDeletionImpactDto {
  @ApiProperty({ example: true })
  podeExcluir: boolean;

  @ApiProperty({ example: 0 })
  chamada: number;

  @ApiProperty({ example: 0 })
  papeis: number;

  @ApiProperty({ example: 0 })
  observacoes: number;

  @ApiProperty({ example: 0 })
  avaliacoes: number;

  @ApiProperty({ example: 0 })
  feedbacks: number;
}
