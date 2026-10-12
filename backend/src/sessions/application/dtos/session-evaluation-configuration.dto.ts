import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export enum SessionFormulaComponentType {
  CRITERIOS = 'CRITERIOS',
  PAPEL = 'PAPEL',
}

export class SessionPerformanceCriterionDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty({ minimum: 0, maximum: 10 })
  peso: number;

  @ApiProperty({ minimum: 0, exclusiveMinimum: true, maximum: 10 })
  notaMaxima: number;
}

export class SessionPerformanceTableDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  padrao: boolean;

  @ApiProperty({ type: SessionPerformanceCriterionDto, isArray: true })
  criterios: SessionPerformanceCriterionDto[];
}

export class SessionFormulaComponentDto {
  @ApiProperty({ enum: SessionFormulaComponentType })
  tipo: SessionFormulaComponentType;

  @ApiProperty({ minimum: 0, maximum: 100 })
  peso: number;
}

export class SessionFormulaDto {
  @ApiProperty()
  padrao: boolean;

  @ApiProperty({ nullable: true, type: Number })
  versao: number | null;

  @ApiProperty({ type: SessionFormulaComponentDto, isArray: true })
  componentes: SessionFormulaComponentDto[];
}

export class SessionEvaluationConfigurationDto {
  @ApiProperty({ type: SessionPerformanceTableDto })
  tabela: SessionPerformanceTableDto;

  @ApiProperty({ type: SessionFormulaDto })
  formula: SessionFormulaDto;

  @ApiProperty()
  bloqueada: boolean;
}

export class UpdateSessionTableDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'O ID da tabela deve ser um UUID válido.' })
  tabelaId: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean({ message: 'O campo aplicarNasSeguintes deve ser um booleano.' })
  aplicarNasSeguintes?: boolean;
}

export class UpdateSessionFormulaComponentDto {
  @ApiProperty({ enum: SessionFormulaComponentType })
  @IsEnum(SessionFormulaComponentType, { message: 'O tipo de componente é inválido.' })
  tipo: SessionFormulaComponentType;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsNumber({}, { message: 'O peso deve ser numérico.' })
  @Min(0, { message: 'O peso deve estar entre 0 e 100.' })
  @Max(100, { message: 'O peso deve estar entre 0 e 100.' })
  peso: number;
}

export class UpdateSessionFormulaDto {
  @ApiProperty({ type: UpdateSessionFormulaComponentDto, isArray: true })
  @IsArray({ message: 'Os componentes devem ser uma lista.' })
  @ArrayMinSize(1, { message: 'Informe os componentes da fórmula.' })
  @ValidateNested({ each: true })
  @Type(() => UpdateSessionFormulaComponentDto)
  componentes: UpdateSessionFormulaComponentDto[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean({ message: 'O campo aplicarNasSeguintes deve ser um booleano.' })
  aplicarNasSeguintes?: boolean;
}

export interface SessionTableChangeResponse {
  sessoesAtualizadas: Array<{ sessaoId: string; rotulo: string }>;
  sessoesIgnoradas: Array<{ sessaoId: string; rotulo: string; motivo: string }>;
}
