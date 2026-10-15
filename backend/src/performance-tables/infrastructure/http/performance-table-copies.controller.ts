import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { CopyPerformanceTableDto } from '../../application/dtos/copy-performance-table.dto';
import { CopyPerformanceTableUseCase } from '../../application/use-cases/copy-performance-table.use-case';
import { toPerformanceTableResponse } from './performance-table.mapper';
import { CopyPerformanceTableSwaggerDocs } from './performance-table-copies.swagger';

@ApiTags('Tabelas de desempenho')
@Controller('tabelas-desempenho')
@Roles(UserType.TUTOR)
export class PerformanceTableCopiesController {
  constructor(private readonly copy: CopyPerformanceTableUseCase) {}

  @Post(':id/copias')
  @CopyPerformanceTableSwaggerDocs
  async create(
    @UuidParam('id') tableId: string,
    @Body() dto: CopyPerformanceTableDto,
    @AuthenticatedUserId() tutorId: string,
  ) {
    return toPerformanceTableResponse(
      await this.copy.execute({ tableId, tutorId, name: dto.nome, roomId: dto.salaId }),
    );
  }
}
