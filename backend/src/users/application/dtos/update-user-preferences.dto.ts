import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, Matches, ValidateIf } from 'class-validator';
import {
  DEFAULT_SYSTEM_COLOR,
  HEX_COLOR_PATTERN,
} from '../../domain/entities/user-preferences.entity';
import { UserThemePayload } from './user-theme-payload.enum';

const isDefined = (_object: unknown, value: unknown): boolean => value !== undefined;

export { DEFAULT_SYSTEM_COLOR };

export class UpdateUserPreferencesDto {
  @ApiPropertyOptional({
    enum: UserThemePayload,
    example: UserThemePayload.ESCURO,
    description:
      'Tema da interface. Aceita CLARO ou ESCURO. Quando omitido, preserva o valor atual (padrão inicial: CLARO).',
  })
  @ValidateIf(isDefined)
  @IsEnum(UserThemePayload, { message: 'O tema deve ser CLARO ou ESCURO.' })
  tema?: UserThemePayload;

  @ApiPropertyOptional({
    type: String,
    pattern: HEX_COLOR_PATTERN.source,
    example: DEFAULT_SYSTEM_COLOR,
    description:
      `Cor principal no formato hexadecimal completo #RRGGBB (normalizada para maiúsculas). ` +
      `Envie ${DEFAULT_SYSTEM_COLOR} para restaurar a cor padrão do sistema. ` +
      `Quando omitida, preserva o valor atual (padrão inicial: ${DEFAULT_SYSTEM_COLOR}).`,
  })
  @ValidateIf(isDefined)
  @IsString({ message: 'A cor deve estar no formato hexadecimal completo #RRGGBB.' })
  @Matches(HEX_COLOR_PATTERN, {
    message: 'A cor deve estar no formato hexadecimal completo #RRGGBB.',
  })
  cor?: string;
}
