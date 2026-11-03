import { Controller, Get, Header, Query, StreamableFile } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { toReportFileResponse } from '@/report-files/infrastructure/http/report-file-response';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { ExportClassReportQueryDto } from '../../application/dtos/export-class-report-query.dto';
import { ExportClassFinalReportUseCase } from '../../application/use-cases/export-class-final-report.use-case';
import { ExportClassFinalReportSwaggerDocs } from './class-report-export.swagger';

@ApiTags('Salas')
@Controller('salas/:salaId/relatorio-final/exportacao')
@Roles(UserType.TUTOR)
export class ClassReportExportController {
  constructor(private readonly exportClassFinalReport: ExportClassFinalReportUseCase) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  @ExportClassFinalReportSwaggerDocs
  async get(
    @UuidParam('salaId') roomId: string,
    @AuthenticatedUserId() tutorId: string,
    @Query() query: ExportClassReportQueryDto,
  ): Promise<StreamableFile> {
    const file = await this.exportClassFinalReport.execute({
      roomId,
      tutorId,
      format: query.formato,
      ocultarNomes: query.ocultarNomes,
    });
    return toReportFileResponse(file);
  }
}
