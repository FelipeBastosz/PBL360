import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UserType } from '../../domain/enums/user-type.enum';
import { SearchTutorsUseCase } from '../../application/use-cases/search-tutors.use-case';
import { SearchTutorsQueryDto } from '../../application/dtos/search-tutors-query.dto';
import type { TutorResponseDto } from '../../application/dtos/tutor-response.dto';
import { toTutorResponse } from './tutor.mapper';
import { SearchTutorsSwaggerDocs } from './tutors.swagger';

@ApiTags('Usuários - Professores')
@Controller('usuarios/professores')
@Roles(UserType.TUTOR)
export class TutorsController {
  constructor(private readonly searchTutors: SearchTutorsUseCase) {}

  @Get()
  @SearchTutorsSwaggerDocs
  async search(@Query() query: SearchTutorsQueryDto): Promise<TutorResponseDto[]> {
    const tutors = await this.searchTutors.execute(query.busca);
    return tutors.map(toTutorResponse);
  }
}
