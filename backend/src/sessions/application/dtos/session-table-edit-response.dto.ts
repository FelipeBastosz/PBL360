import { ApiProperty } from '@nestjs/swagger';

export class UpdatedTableSessionDto {
  @ApiProperty({ format: 'uuid' })
  sessaoId: string;

  @ApiProperty({ example: 'P1S2' })
  rotulo: string;
}

export class TableSessionUsageDto extends UpdatedTableSessionDto {
  @ApiProperty({ description: 'Data de hoje ou anterior, ou avaliação do tutor enviada.' })
  jaAconteceu: boolean;
}

export class SessionTableEditPermissionsDto {
  @ApiProperty()
  podeEditarCriterios: boolean;

  @ApiProperty({ type: String, nullable: true })
  motivo: string | null;

  @ApiProperty({ type: TableSessionUsageDto, isArray: true })
  sessoesQueUsam: TableSessionUsageDto[];
}

export class EditedSessionTableDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Barema PBL — P1S2' })
  nome: string;
}

export class SessionTableEditResponseDto {
  @ApiProperty({ type: EditedSessionTableDto })
  tabela: EditedSessionTableDto;

  @ApiProperty({ type: UpdatedTableSessionDto, isArray: true })
  sessoesAtualizadas: UpdatedTableSessionDto[];
}
