import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { GradeRecalculationNoticeDto } from '../../application/dtos/grade-recalculation-notice.dto';

export const ListGradeRecalculationNoticesSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({ summary: 'Lista avisos de recálculo das notas do aluno' }),
  ApiOkResponse({
    description: 'Histórico recente de notas recalculadas.',
    type: GradeRecalculationNoticeDto,
    isArray: true,
  }),
);
