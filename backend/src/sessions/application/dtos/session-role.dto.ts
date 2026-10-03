import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { SessionRole } from '../../domain/enums/session-role.enum';

export enum SessionRolePayload {
  COORDENADOR = 'COORDENADOR',
  SECRETARIO_QUADRO = 'SECRETARIO_QUADRO',
  SECRETARIO_MESA = 'SECRETARIO_MESA',
}

export const SESSION_ROLE_TO_DOMAIN: Record<SessionRolePayload, SessionRole> = {
  [SessionRolePayload.COORDENADOR]: SessionRole.COORDINATOR,
  [SessionRolePayload.SECRETARIO_QUADRO]: SessionRole.BOARD_SECRETARY,
  [SessionRolePayload.SECRETARIO_MESA]: SessionRole.TABLE_SECRETARY,
};

export const DOMAIN_TO_SESSION_ROLE: Record<SessionRole, SessionRolePayload> = {
  [SessionRole.COORDINATOR]: SessionRolePayload.COORDENADOR,
  [SessionRole.BOARD_SECRETARY]: SessionRolePayload.SECRETARIO_QUADRO,
  [SessionRole.TABLE_SECRETARY]: SessionRolePayload.SECRETARIO_MESA,
};

export class UpdateSessionRoleDto {
  @ApiProperty({ enum: [...Object.values(SessionRolePayload), null], nullable: true })
  @IsOptional()
  @IsEnum(SessionRolePayload)
  papel?: SessionRolePayload | null;

  @ApiPropertyOptional({ minimum: 0, maximum: 1, example: 0.5, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1)
  notaAdicional?: number | null;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  transferir?: boolean;
}

export class SessionRoleResponseDto {
  @ApiProperty() alunoId: string;
  @ApiProperty() nome: string;
  @ApiProperty({ enum: SessionRolePayload }) papel: SessionRolePayload;
  @ApiProperty({ nullable: true }) notaAdicional: number | null;
}

export class AssignedSessionRoleResponseDto {
  @ApiProperty() alunoId: string;
  @ApiProperty({ enum: SessionRolePayload, nullable: true }) papel: SessionRolePayload | null;
  @ApiProperty({ nullable: true }) notaAdicional: number | null;
}
