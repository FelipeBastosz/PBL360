import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  AuthenticatedUser,
  type AuthenticatedUserRef,
} from '@/shared/decorators/authenticated-user.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import type { ProblemTableReportResponseDto } from '../../application/dtos/problem-table-report.dto';
import { ListProblemTableReportsUseCase } from '../../application/use-cases/list-problem-table-reports.use-case';
import { toProblemTableReportResponse } from './problem-table-reports.mapper';
import { ListProblemTableReportsSwaggerDocs } from './problem-table-reports.swagger';

@ApiTags('Anexos da sessão')
@Controller('salas/:salaId/problemas/:problemaId/relatorios-mesa')
@Roles(UserType.TUTOR, UserType.STUDENT)
export class ProblemTableReportsController {
  constructor(private readonly listTableReports: ListProblemTableReportsUseCase) {}

  @Get()
  @ListProblemTableReportsSwaggerDocs
  async list(
    @UuidParam('salaId') roomId: string,
    @UuidParam('problemaId') problemId: string,
    @AuthenticatedUser() member: AuthenticatedUserRef,
  ): Promise<ProblemTableReportResponseDto[]> {
    const reports = await this.listTableReports.execute({ roomId, problemId, member });
    return reports.map(toProblemTableReportResponse);
  }
}
