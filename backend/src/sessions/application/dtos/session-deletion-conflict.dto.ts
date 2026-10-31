import { ApiProperty, OmitType } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { SessionDeletionImpactDto } from './session-deletion-impact.dto';

export class SessionDeletionDetailsDto extends OmitType(SessionDeletionImpactDto, [
  'podeExcluir',
] as const) {}

export class SessionDeletionConflictDto extends ErrorResponseDto {
  @ApiProperty({ type: SessionDeletionDetailsDto })
  detalhes: SessionDeletionDetailsDto;
}
