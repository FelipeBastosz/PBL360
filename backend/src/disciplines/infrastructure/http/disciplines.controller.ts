import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import type { DisciplineResponseDto } from '../../application/dtos/discipline-response.dto';
import { ListDisciplinesUseCase } from '../../application/use-cases/list-disciplines.use-case';
import { toDisciplineResponse } from './discipline.mapper';
import { ListDisciplinesSwaggerDocs } from './discipline.swagger';

@ApiTags('Disciplinas')
@Controller('disciplinas')
@Roles(UserType.TUTOR)
export class DisciplinesController {
  constructor(private readonly listDisciplines: ListDisciplinesUseCase) {}

  @Get()
  @ListDisciplinesSwaggerDocs
  async list(): Promise<DisciplineResponseDto[]> {
    const disciplines = await this.listDisciplines.execute();
    return disciplines.map(toDisciplineResponse);
  }
}
