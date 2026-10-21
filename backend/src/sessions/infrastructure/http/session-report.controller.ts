import {
  Controller,
  Get,
  InternalServerErrorException,
  Query,
  type StreamableFile,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { ReportExportQueryDto } from '@/report-files/application/dtos/report-export-query.dto';
import { ReportGenerationError } from '@/report-files/application/errors/report-generation.error';
import { toReportFileResponse } from '@/report-files/infrastructure/http/report-file-response';
import { ExportSessionReportUseCase } from '../../application/use-cases/export-session-report.use-case';
import { ExportSessionReportSwaggerDocs } from './session-report.swagger';

function handleReportError(error: unknown): never {
  if (error instanceof ReportGenerationError) {
    throw new InternalServerErrorException(error.message);
  }
  throw error;
}

@ApiTags('Sessões')
@Controller('sessoes/:sessaoId/relatorio')
@Roles(UserType.TUTOR)
export class SessionReportController {
  constructor(private readonly exportSessionReport: ExportSessionReportUseCase) {}

  @Get('exportacao')
  @ExportSessionReportSwaggerDocs
  async export(
    @UuidParam('sessaoId') sessionId: string,
    @Query() query: ReportExportQueryDto,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<StreamableFile> {
    const file = await this.exportSessionReport
      .execute({ sessionId, format: query.formato, tutorId })
      .catch(handleReportError);

    return toReportFileResponse(file);
  }
}
