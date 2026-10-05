import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { AttendanceStatus } from '../../domain/enums/attendance-status.enum';
import { RollCallOrigin } from '../../domain/roll-call/roll-call';

export enum AttendanceStatusPayload {
  PRESENTE = 'PRESENTE',
  ATRASADO = 'ATRASADO',
  JUSTIFICADO = 'JUSTIFICADO',
  AUSENTE = 'AUSENTE',
}

export enum RollCallOriginPayload {
  REGISTRADA = 'REGISTRADA',
  SESSAO_ANTERIOR = 'SESSAO_ANTERIOR',
  VAZIA = 'VAZIA',
}

export const ATTENDANCE_STATUS_TO_DOMAIN: Record<AttendanceStatusPayload, AttendanceStatus> = {
  [AttendanceStatusPayload.PRESENTE]: AttendanceStatus.PRESENT,
  [AttendanceStatusPayload.ATRASADO]: AttendanceStatus.LATE,
  [AttendanceStatusPayload.JUSTIFICADO]: AttendanceStatus.EXCUSED,
  [AttendanceStatusPayload.AUSENTE]: AttendanceStatus.ABSENT,
};

export const DOMAIN_TO_ATTENDANCE_STATUS: Record<AttendanceStatus, AttendanceStatusPayload> = {
  [AttendanceStatus.PRESENT]: AttendanceStatusPayload.PRESENTE,
  [AttendanceStatus.LATE]: AttendanceStatusPayload.ATRASADO,
  [AttendanceStatus.EXCUSED]: AttendanceStatusPayload.JUSTIFICADO,
  [AttendanceStatus.ABSENT]: AttendanceStatusPayload.AUSENTE,
};

export const DOMAIN_TO_ROLL_CALL_ORIGIN: Record<RollCallOrigin, RollCallOriginPayload> = {
  [RollCallOrigin.RECORDED]: RollCallOriginPayload.REGISTRADA,
  [RollCallOrigin.PREVIOUS_SESSION]: RollCallOriginPayload.SESSAO_ANTERIOR,
  [RollCallOrigin.EMPTY]: RollCallOriginPayload.VAZIA,
};

export class AttendanceRecordDto {
  @ApiProperty({ format: 'uuid', description: 'Aluno matriculado na sala.' })
  @IsUUID('4', { message: 'O aluno informado é inválido.' })
  alunoId!: string;

  @ApiProperty({ enum: AttendanceStatusPayload, example: AttendanceStatusPayload.PRESENTE })
  @IsEnum(AttendanceStatusPayload, {
    message: 'O status deve ser PRESENTE, ATRASADO, JUSTIFICADO ou AUSENTE.',
  })
  status!: AttendanceStatusPayload;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    minimum: 1,
    description: 'Lugar na mesa, de 1 até o total de lugares. Só com PRESENTE ou ATRASADO.',
    example: 3,
  })
  @IsOptional()
  @IsInt({ message: 'O lugar deve ser um número inteiro.' })
  @Min(1, { message: 'O lugar deve ser no mínimo 1.' })
  lugar?: number | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    maxLength: 500,
    description: 'Aceita só com JUSTIFICADO.',
    example: 'Atestado médico.',
  })
  @IsOptional()
  @IsString({ message: 'A justificativa deve ser um texto.' })
  @MaxLength(500, { message: 'A justificativa deve ter no máximo 500 caracteres.' })
  justificativa?: string | null;
}

export class RecordRollCallDto {
  @ApiProperty({ type: AttendanceRecordDto, isArray: true, minItems: 1 })
  @IsArray({ message: 'Os registros devem ser uma lista.' })
  @ArrayMinSize(1, { message: 'Informe ao menos um registro de presença.' })
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  registros!: AttendanceRecordDto[];
}

export class SessionReferenceResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'date', example: '2026-10-01' }) data: string;
}

export class RollCallStudentResponseDto {
  @ApiProperty({ format: 'uuid' }) alunoId: string;
  @ApiProperty({ example: 'Ana Souza' }) nome: string;
  @ApiProperty({ example: 'AS' }) iniciais: string;
  @ApiProperty({ type: Number, nullable: true, example: 1 }) lugar: number | null;
  @ApiProperty({ enum: AttendanceStatusPayload, nullable: true })
  status: AttendanceStatusPayload | null;
  @ApiProperty({ type: String, nullable: true }) justificativa: string | null;
}

export class RollCallTotalsResponseDto {
  @ApiProperty() presentes: number;
  @ApiProperty() atrasados: number;
  @ApiProperty() justificados: number;
  @ApiProperty() ausentes: number;
  @ApiProperty() semRegistro: number;
}

export class RollCallResponseDto {
  @ApiProperty({ format: 'uuid' }) sessaoId: string;
  @ApiProperty({ enum: RollCallOriginPayload }) origem: RollCallOriginPayload;
  @ApiProperty({ type: SessionReferenceResponseDto, nullable: true })
  sessaoReferencia: SessionReferenceResponseDto | null;
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  registradaEm: Date | null;
  @ApiProperty({ description: 'Total de lugares da mesa, um por aluno matriculado.' })
  lugares: number;
  @ApiProperty({ type: RollCallStudentResponseDto, isArray: true })
  alunos: RollCallStudentResponseDto[];
  @ApiProperty({ type: RollCallTotalsResponseDto }) totais: RollCallTotalsResponseDto;
}
