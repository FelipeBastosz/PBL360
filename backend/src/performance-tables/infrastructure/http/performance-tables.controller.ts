import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { CreatePerformanceTableDto } from '../../application/dtos/create-performance-table.dto';
import { PerformanceTableResponseDto } from '../../application/dtos/performance-table-response.dto';
import { PerformanceTableSummaryResponseDto } from '../../application/dtos/performance-table-summary-response.dto';
import { CreatePerformanceTableUseCase } from '../../application/use-cases/create-performance-table.use-case';
import { DeletePerformanceTableUseCase } from '../../application/use-cases/delete-performance-table.use-case';
import { ListPerformanceTablesUseCase } from '../../application/use-cases/list-performance-tables.use-case';
import {
  CreatePerformanceTableSwaggerDocs,
  DeletePerformanceTableSwaggerDocs,
  ListPerformanceTablesSwaggerDocs,
} from './performance-table.swagger';
import {
  toCreatePerformanceTableInput,
  toPerformanceTableResponse,
} from './performance-table.mapper';

@ApiTags('Tabelas de desempenho')
@Controller('tabelas-desempenho')
@Roles(UserType.TUTOR)
export class PerformanceTablesController {
  constructor(
    private readonly createPerformanceTableUseCase: CreatePerformanceTableUseCase,
    private readonly listPerformanceTablesUseCase: ListPerformanceTablesUseCase,
    private readonly deletePerformanceTableUseCase: DeletePerformanceTableUseCase,
  ) {}

  @Post()
  @CreatePerformanceTableSwaggerDocs
  async create(
    @Body() dto: CreatePerformanceTableDto,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<PerformanceTableResponseDto> {
    const table = await this.createPerformanceTableUseCase.execute(
      toCreatePerformanceTableInput(dto, tutorId),
    );

    return toPerformanceTableResponse(table);
  }

  @Get()
  @ListPerformanceTablesSwaggerDocs
  async list(
    @AuthenticatedUserId() tutorId: string,
  ): Promise<PerformanceTableSummaryResponseDto[]> {
    const tables = await this.listPerformanceTablesUseCase.execute(tutorId);

    return tables.map((table) => ({
      id: table.id,
      professorId: table.tutorId,
      nome: table.name,
      descricao: table.description,
      quantidadeCriterios: table.criteriaCount,
      quantidadeProblemas: table.problemCount,
      criadoEm: table.createdAt,
      atualizadoEm: table.updatedAt,
    }));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @DeletePerformanceTableSwaggerDocs
  delete(@UuidParam('id') tableId: string, @AuthenticatedUserId() tutorId: string): Promise<void> {
    return this.deletePerformanceTableUseCase.execute(tableId, tutorId);
  }
}
