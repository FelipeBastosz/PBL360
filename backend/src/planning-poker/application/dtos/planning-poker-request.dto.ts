import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export enum PokerOrderPayload {
  SEQUENCIAL = 'SEQUENCIAL',
  MANUAL = 'MANUAL',
}

export enum PokerDecisionPayload {
  ACEITAR = 'ACEITAR',
  REAJUSTAR = 'REAJUSTAR',
}

const GRADE_OPTIONS = { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 };
const POKER_GRADE_OPTIONS = { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 1 };
const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class StartPlanningPokerDto {
  @ApiProperty({ example: true, description: 'Esconde quem votou o quê, inclusive do professor.' })
  @IsBoolean({ message: 'Informe se o planning poker é anônimo.' })
  anonimo!: boolean;

  @ApiProperty({ enum: PokerOrderPayload, example: PokerOrderPayload.SEQUENCIAL })
  @IsEnum(PokerOrderPayload, { message: 'A ordem deve ser SEQUENCIAL ou MANUAL.' })
  ordem!: PokerOrderPayload;
}

export class OpenPokerRoundDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Obrigatório no modo MANUAL.' })
  @IsOptional()
  @IsUUID('4', { message: 'O aluno informado é inválido.' })
  alunoId?: string;
}

export class ReorderPokerQueueDto {
  @ApiProperty({ type: String, isArray: true, format: 'uuid' })
  @IsArray({ message: 'A fila deve ser uma lista.' })
  @ArrayUnique({ message: 'A fila não pode repetir alunos.' })
  @IsUUID('4', { each: true, message: 'A fila contém um aluno inválido.' })
  fila!: string[];
}

export class CastPokerVoteDto {
  @ApiProperty({ example: 8.5, minimum: 0, maximum: 10 })
  @IsNumber(GRADE_OPTIONS, { message: 'A nota deve ser um número com até duas casas decimais.' })
  @Min(0, { message: 'A nota mínima é 0.' })
  @Max(10, { message: 'A nota máxima é 10.' })
  nota!: number;
}

export class DecidePokerRoundDto {
  @ApiProperty({ enum: PokerDecisionPayload })
  @IsEnum(PokerDecisionPayload, { message: 'A ação deve ser ACEITAR ou REAJUSTAR.' })
  acao!: PokerDecisionPayload;

  @ApiPropertyOptional({ example: 8.5, description: 'Obrigatória em REAJUSTAR.' })
  @ValidateIf((dto: DecidePokerRoundDto) => dto.acao === PokerDecisionPayload.REAJUSTAR)
  @IsNumber(POKER_GRADE_OPTIONS, { message: 'A nota deve ser um número com até uma casa decimal.' })
  @Min(0, { message: 'A nota mínima é 0.' })
  @Max(10, { message: 'A nota máxima é 10.' })
  nota?: number;

  @ApiPropertyOptional({ minLength: 10, maxLength: 500, description: 'Obrigatória em REAJUSTAR.' })
  @ValidateIf((dto: DecidePokerRoundDto) => dto.acao === PokerDecisionPayload.REAJUSTAR)
  @Transform(trim)
  @IsString({ message: 'A justificativa deve ser um texto.' })
  @Length(10, 500, { message: 'A justificativa deve ter entre 10 e 500 caracteres.' })
  justificativa?: string;
}
