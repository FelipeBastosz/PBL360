import { ApiProperty } from '@nestjs/swagger';
import {
  DEFAULT_SYSTEM_COLOR,
  HEX_COLOR_PATTERN,
} from '../../domain/entities/user-preferences.entity';
import { UserThemePayload } from './user-theme-payload.enum';

export class UserPreferencesResponseDto {
  @ApiProperty({
    enum: UserThemePayload,
    example: UserThemePayload.CLARO,
    description: 'Tema atual da conta autenticada (padrão inicial: CLARO).',
  })
  tema: UserThemePayload;

  @ApiProperty({
    type: String,
    pattern: HEX_COLOR_PATTERN.source,
    example: DEFAULT_SYSTEM_COLOR,
    description: `Cor principal atual em hexadecimal maiúsculo #RRGGBB (padrão inicial: ${DEFAULT_SYSTEM_COLOR}).`,
  })
  cor: string;
}
