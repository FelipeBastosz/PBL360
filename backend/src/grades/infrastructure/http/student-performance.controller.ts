import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { StudentPerformanceQueryDto } from '../../application/dtos/student-performance-query.dto';
import type { StudentPerformanceResponseDto } from '../../application/dtos/student-performance-response.dto';
import { GetStudentPerformanceUseCase } from '../../application/use-cases/get-student-performance.use-case';
import { GetStudentPerformanceSwaggerDocs } from './student-performance.swagger';

@ApiTags('Desempenho')
@Controller('salas/:salaId/alunos/:alunoId/desempenho')
@Roles(UserType.TUTOR)
export class StudentPerformanceController {
  constructor(private readonly getStudentPerformance: GetStudentPerformanceUseCase) {}

  @Get()
  @GetStudentPerformanceSwaggerDocs
  get(
    @UuidParam('salaId') roomId: string,
    @UuidParam('alunoId') studentId: string,
    @AuthenticatedUserId() tutorId: string,
    @Query() query: StudentPerformanceQueryDto,
  ): Promise<StudentPerformanceResponseDto> {
    return this.getStudentPerformance.execute({
      roomId,
      studentId,
      tutorId,
      problemId: query.problemaId,
    });
  }
}
