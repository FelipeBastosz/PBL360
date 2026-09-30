import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { DeletePerformanceTableUseCase } from '../../application/use-cases/delete-performance-table.use-case';
import { DeletePerformanceTableSwaggerDocs } from './performance-tables.swagger';

@ApiTags('Tabelas de desempenho')
@Controller('tabelas-desempenho')
@Roles(UserType.TUTOR)
export class PerformanceTablesController {
  constructor(private readonly deletePerformanceTable: DeletePerformanceTableUseCase) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @DeletePerformanceTableSwaggerDocs
  delete(@UuidParam('id') tableId: string, @AuthenticatedUserId() tutorId: string): Promise<void> {
    return this.deletePerformanceTable.execute(tableId, tutorId);
  }
}
