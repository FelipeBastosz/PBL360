import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { GetProblemGradesUseCase } from '../../application/use-cases/get-problem-grades.use-case';
import type { GradesResponseDto } from '../../application/dtos/grades-response.dto';
import { GetProblemGradesSwaggerDocs } from './grades.swagger';

@ApiTags('Notas')
@Controller('salas/:roomId/problemas/:problemId/notas')
@Roles(UserType.TUTOR)
export class GradesController {
  constructor(private readonly getProblemGrades: GetProblemGradesUseCase) {}

  @Get()
  @GetProblemGradesSwaggerDocs
  async get(
    @UuidParam('roomId') roomId: string,
    @UuidParam('problemId') problemId: string,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<GradesResponseDto> {
    return this.getProblemGrades.execute({ roomId, problemId, tutorId });
  }
}
