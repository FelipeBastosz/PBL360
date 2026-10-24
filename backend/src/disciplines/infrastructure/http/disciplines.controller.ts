import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { CreateDisciplineDto } from '../../application/dtos/create-discipline.dto';
import type { DisciplineResponseDto } from '../../application/dtos/discipline-response.dto';
import { CreateDisciplineUseCase } from '../../application/use-cases/create-discipline.use-case';
import { ListDisciplinesUseCase } from '../../application/use-cases/list-disciplines.use-case';
import { toDisciplineResponse } from './discipline.mapper';
import { CreateDisciplineSwaggerDocs, ListDisciplinesSwaggerDocs } from './discipline.swagger';

@ApiTags('Disciplinas')
@Controller('disciplinas')
@Roles(UserType.TUTOR)
export class DisciplinesController {
  constructor(
    private readonly listDisciplines: ListDisciplinesUseCase,
    private readonly createDiscipline: CreateDisciplineUseCase,
  ) {}

  @Get()
  @ListDisciplinesSwaggerDocs
  async list(): Promise<DisciplineResponseDto[]> {
    const disciplines = await this.listDisciplines.execute();
    return disciplines.map(toDisciplineResponse);
  }

  @Post()
  @CreateDisciplineSwaggerDocs
  async create(@Body() dto: CreateDisciplineDto): Promise<DisciplineResponseDto> {
    return toDisciplineResponse(
      await this.createDiscipline.execute({ code: dto.codigo, name: dto.nome }),
    );
  }
}
