import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { GetClassFinalReportUseCase } from '../../application/use-cases/get-class-final-report.use-case';
import type { ClassFinalReportResponseDto } from '../../application/dtos/class-final-report-response.dto';
import { GetClassFinalReportSwaggerDocs } from './class-report.swagger';

@ApiTags('Salas')
@Controller('salas/:salaId/relatorio-final')
@Roles(UserType.TUTOR)
export class ClassReportController {
  constructor(private readonly getClassFinalReport: GetClassFinalReportUseCase) {}

  @Get()
  @GetClassFinalReportSwaggerDocs
  async get(
    @UuidParam('salaId') roomId: string,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<ClassFinalReportResponseDto> {
    return this.getClassFinalReport.execute({ roomId, tutorId });
  }
}
