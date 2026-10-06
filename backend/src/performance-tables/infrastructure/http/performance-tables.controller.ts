import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { CreatePerformanceTableDto } from '../../application/dtos/create-performance-table.dto';
import { PerformanceTableResponseDto } from '../../application/dtos/performance-table-response.dto';
import { PerformanceTableSummaryResponseDto } from '../../application/dtos/performance-table-summary-response.dto';
import { UpdatePerformanceTableDto } from '../../application/dtos/update-performance-table.dto';
import { CreatePerformanceTableUseCase } from '../../application/use-cases/create-performance-table.use-case';
import { DeletePerformanceTableUseCase } from '../../application/use-cases/delete-performance-table.use-case';
import { GetPerformanceTableUseCase } from '../../application/use-cases/get-performance-table.use-case';
import { ListPerformanceTablesUseCase } from '../../application/use-cases/list-performance-tables.use-case';
import { UpdatePerformanceTableUseCase } from '../../application/use-cases/update-performance-table.use-case';
import {
  CreatePerformanceTableSwaggerDocs,
  DeletePerformanceTableSwaggerDocs,
  GetPerformanceTableSwaggerDocs,
  ListPerformanceTablesSwaggerDocs,
  UpdatePerformanceTableSwaggerDocs,
} from './performance-table.swagger';
import {
  toCreatePerformanceTableInput,
  toPerformanceTableResponse,
  toUpdatePerformanceTableInput,
} from './performance-table.mapper';

@ApiTags('Tabelas de desempenho')
@Controller('tabelas-desempenho')
@Roles(UserType.TUTOR)
export class PerformanceTablesController {
  constructor(
    private readonly createPerformanceTableUseCase: CreatePerformanceTableUseCase,
    private readonly listPerformanceTablesUseCase: ListPerformanceTablesUseCase,
    private readonly getPerformanceTableUseCase: GetPerformanceTableUseCase,
    private readonly deletePerformanceTableUseCase: DeletePerformanceTableUseCase,
    private readonly updatePerformanceTableUseCase: UpdatePerformanceTableUseCase,
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
      isDefault: table.isDefault,
      descricao: table.description,
      quantidadeCriterios: table.criteriaCount,
      quantidadeProblemas: table.problemCount,
      criadoEm: table.createdAt,
      atualizadoEm: table.updatedAt,
    }));
  }

  @Get(':id')
  @GetPerformanceTableSwaggerDocs
  async getById(
    @UuidParam('id') id: string,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<PerformanceTableResponseDto> {
    const table = await this.getPerformanceTableUseCase.execute({
      tableId: id,
      tutorId,
    });

    return toPerformanceTableResponse(table);
  }

  @Put(':id')
  @UpdatePerformanceTableSwaggerDocs
  async update(
    @UuidParam('id') tableId: string,
    @Body() dto: UpdatePerformanceTableDto,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<PerformanceTableResponseDto> {
    const table = await this.updatePerformanceTableUseCase.execute(
      tableId,
      tutorId,
      toUpdatePerformanceTableInput(dto),
    );

    return toPerformanceTableResponse(table);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @DeletePerformanceTableSwaggerDocs
  delete(@UuidParam('id') tableId: string, @AuthenticatedUserId() tutorId: string): Promise<void> {
    return this.deletePerformanceTableUseCase.execute(tableId, tutorId);
  }
}
