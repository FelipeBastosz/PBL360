import { Controller, Get, Header, Query, UseFilters, type StreamableFile } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { ReportExportQueryDto } from '@/report-files/application/dtos/report-export-query.dto';
import { ReportGenerationFilter } from '@/report-files/infrastructure/http/report-generation.filter';
import { toReportFileResponse } from '@/report-files/infrastructure/http/report-file-response';
import { ExportSessionReportUseCase } from '../../application/use-cases/export-session-report.use-case';
import { ExportSessionReportSwaggerDocs } from './session-report.swagger';

@ApiTags('Sessões')
@Controller('sessoes/:sessaoId/relatorio')
@Roles(UserType.TUTOR)
@UseFilters(ReportGenerationFilter)
export class SessionReportController {
  constructor(private readonly exportSessionReport: ExportSessionReportUseCase) {}

  @Get('exportacao')
  @Header('Cache-Control', 'private, no-store')
  @ExportSessionReportSwaggerDocs
  async export(
    @UuidParam('sessaoId') sessionId: string,
    @Query() query: ReportExportQueryDto,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<StreamableFile> {
    const file = await this.exportSessionReport.execute({
      sessionId,
      format: query.formato,
      tutorId,
    });

    return toReportFileResponse(file);
  }
}
