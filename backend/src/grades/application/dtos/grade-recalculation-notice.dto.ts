import { ApiProperty } from '@nestjs/swagger';

export class GradeRecalculationNoticeDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  sessaoId!: string;

  @ApiProperty()
  sessao!: string;

  @ApiProperty()
  notaAnterior!: number;

  @ApiProperty()
  notaAtualizada!: number;

  @ApiProperty({ example: 'Nota recalculada devido à alteração dos pesos dos critérios.' })
  motivo!: string;

  @ApiProperty()
  criadoEm!: Date;
}
