import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { CreatePerformanceTableDto } from '../../application/dtos/create-performance-table.dto';
import { PerformanceTableResponseDto } from '../../application/dtos/performance-table-response.dto';
import { RoomPerformanceTableItemResponseDto } from '../../application/dtos/room-performance-table-response.dto';
import { CreatePerformanceTableUseCase } from '../../application/use-cases/create-performance-table.use-case';
import { ListRoomPerformanceTablesUseCase } from '../../application/use-cases/list-room-performance-tables.use-case';
import {
  CreateRoomPerformanceTableSwaggerDocs,
  ListRoomPerformanceTablesSwaggerDocs,
} from './room-performance-tables.swagger';
import {
  toCreatePerformanceTableInput,
  toPerformanceTableResponse,
} from './performance-table.mapper';

@ApiTags('Tabelas de desempenho da turma')
@Controller('salas/:salaId/tabelas-desempenho')
@Roles(UserType.TUTOR)
export class RoomPerformanceTablesController {
  constructor(
    private readonly listRoomPerformanceTablesUseCase: ListRoomPerformanceTablesUseCase,
    private readonly createPerformanceTableUseCase: CreatePerformanceTableUseCase,
  ) {}

  @Get()
  @ListRoomPerformanceTablesSwaggerDocs
  async list(
    @UuidParam('salaId') roomId: string,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<RoomPerformanceTableItemResponseDto[]> {
    return this.listRoomPerformanceTablesUseCase.execute({ roomId, tutorId });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @CreateRoomPerformanceTableSwaggerDocs
  async create(
    @UuidParam('salaId') roomId: string,
    @Body() dto: CreatePerformanceTableDto,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<PerformanceTableResponseDto> {
    const input = {
      ...toCreatePerformanceTableInput(dto, tutorId),
      roomId,
    };
    const table = await this.createPerformanceTableUseCase.execute(input);

    return toPerformanceTableResponse(table);
  }
}
