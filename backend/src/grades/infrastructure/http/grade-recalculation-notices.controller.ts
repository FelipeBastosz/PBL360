import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import type { GradeRecalculationNoticeDto } from '../../application/dtos/grade-recalculation-notice.dto';
import { ListGradeRecalculationNoticesUseCase } from '../../application/use-cases/list-grade-recalculation-notices.use-case';
import { ListGradeRecalculationNoticesSwaggerDocs } from './grade-recalculation-notices.swagger';

@ApiTags('Avisos de notas')
@Controller('avisos-notas')
@Roles(UserType.STUDENT)
export class GradeRecalculationNoticesController {
  constructor(private readonly listNotices: ListGradeRecalculationNoticesUseCase) {}

  @Get()
  @ListGradeRecalculationNoticesSwaggerDocs
  get(@AuthenticatedUserId() studentId: string): Promise<GradeRecalculationNoticeDto[]> {
    return this.listNotices.execute(studentId);
  }
}
