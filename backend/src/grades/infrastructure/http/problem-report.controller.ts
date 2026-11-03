import { Controller, Get, Header, Query, StreamableFile } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { ExportProblemReportQueryDto } from '../../application/dtos/export-problem-report-query.dto';
import { toReportFileResponse } from '@/report-files/infrastructure/http/report-file-response';
import {
  ExportProblemReportUseCase,
  type ExportProblemReportInput,
} from '../../application/use-cases/export-problem-report.use-case';
import { ExportProblemReportSwaggerDocs } from './problem-report.swagger';

const toExportInput = (
  roomId: string,
  problemId: string,
  tutorId: string,
  query: ExportProblemReportQueryDto,
): ExportProblemReportInput => ({
  roomId,
  problemId,
  tutorId,
  format: query.formato,
  ocultarNomes: query.ocultarNomes ?? query.ocultarNome,
  mostrarPendencias: query.mostrarPendencias,
  mostrarFeedback: query.mostrarFeedback,
  mostrarMarcacoes: query.mostrarMarcacoes,
});

@ApiTags('Problemas')
@Controller('salas/:salaId/problemas/:problemaId/relatorio')
@Roles(UserType.TUTOR)
export class ProblemReportController {
  constructor(private readonly exportProblemReport: ExportProblemReportUseCase) {}

  @Get('exportacao')
  @Header('Cache-Control', 'private, no-store')
  @ExportProblemReportSwaggerDocs
  async export(
    @UuidParam('salaId') roomId: string,
    @UuidParam('problemaId') problemId: string,
    @Query() query: ExportProblemReportQueryDto,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<StreamableFile> {
    const file = await this.exportProblemReport.execute(
      toExportInput(roomId, problemId, tutorId, query),
    );
    return toReportFileResponse(file);
  }
}
