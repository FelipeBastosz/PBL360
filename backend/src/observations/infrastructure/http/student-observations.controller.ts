import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import type {
  ObservationResponseDto,
  StudentObservationsResponseDto,
} from '../../application/dtos/observation-response.dto';
import { RegisterObservationDto } from '../../application/dtos/register-observation.dto';
import { ListStudentObservationsUseCase } from '../../application/use-cases/list-student-observations.use-case';
import { RegisterObservationUseCase } from '../../application/use-cases/register-observation.use-case';
import { toObservationResponse, toStudentObservationsResponse } from './observation.mapper';
import {
  ListStudentObservationsSwaggerDocs,
  RegisterObservationSwaggerDocs,
} from './observation.swagger';

@ApiTags('Observações')
@Controller('sessoes/:sessaoId/alunos/:alunoId/observacoes')
@Roles(UserType.TUTOR)
export class StudentObservationsController {
  constructor(
    private readonly listStudentObservations: ListStudentObservationsUseCase,
    private readonly registerObservation: RegisterObservationUseCase,
  ) {}

  @Get()
  @ListStudentObservationsSwaggerDocs
  async list(
    @UuidParam('sessaoId') sessionId: string,
    @UuidParam('alunoId') studentId: string,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<StudentObservationsResponseDto> {
    const result = await this.listStudentObservations.execute(sessionId, studentId, tutorId);
    return toStudentObservationsResponse(result);
  }

  @Post()
  @RegisterObservationSwaggerDocs
  async register(
    @UuidParam('sessaoId') sessionId: string,
    @UuidParam('alunoId') studentId: string,
    @Body() dto: RegisterObservationDto,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<ObservationResponseDto> {
    const observation = await this.registerObservation.execute({
      sessionId,
      studentId,
      tutorId,
      text: dto.texto ?? null,
      tagIds: dto.marcacaoIds ?? [],
    });
    return toObservationResponse(observation);
  }
}
