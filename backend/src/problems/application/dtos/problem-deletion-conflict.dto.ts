import { ApiProperty } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { ProblemDeletionImpactDto } from './problem-deletion-impact.dto';

export class ProblemDeletionConflictDto extends ErrorResponseDto {
  @ApiProperty({ type: ProblemDeletionImpactDto })
  detalhes: ProblemDeletionImpactDto;
}
