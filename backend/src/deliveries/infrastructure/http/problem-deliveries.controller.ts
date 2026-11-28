import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  AuthenticatedUser,
  type AuthenticatedUserRef,
} from '@/shared/decorators/authenticated-user.decorator';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import type {
  ProblemDeliveriesListResponseDto,
  ProblemDeliveryResponseDto,
} from '../../application/dtos/problem-delivery-response.dto';
import { RegisterProblemDeliveryDto } from '../../application/dtos/register-problem-delivery.dto';
import { ListProblemDeliveriesUseCase } from '../../application/use-cases/list-problem-deliveries.use-case';
import { RegisterProblemDeliveryUseCase } from '../../application/use-cases/register-problem-delivery.use-case';
import {
  toProblemDeliveriesListResponse,
  toProblemDeliveryResponse,
} from './problem-delivery.mapper';
import {
  ListProblemDeliveriesSwaggerDocs,
  RegisterProblemDeliverySwaggerDocs,
} from './problem-deliveries.swagger';

@ApiTags('Entregas')
@Controller('salas/:salaId/problemas/:problemaId/entregas')
export class ProblemDeliveriesController {
  constructor(
    private readonly registerDelivery: RegisterProblemDeliveryUseCase,
    private readonly listDeliveries: ListProblemDeliveriesUseCase,
  ) {}

  @Post()
  @Roles(UserType.STUDENT)
  @HttpCode(HttpStatus.CREATED)
  @RegisterProblemDeliverySwaggerDocs
  async register(
    @UuidParam('salaId') roomId: string,
    @UuidParam('problemaId') problemId: string,
    @Body() dto: RegisterProblemDeliveryDto,
    @AuthenticatedUserId() studentId: string,
  ): Promise<ProblemDeliveryResponseDto> {
    const delivery = await this.registerDelivery.execute({
      roomId,
      problemId,
      studentId,
      url: dto.url,
    });
    return toProblemDeliveryResponse(delivery);
  }

  @Get()
  @Roles(UserType.TUTOR, UserType.STUDENT)
  @HttpCode(HttpStatus.OK)
  @ListProblemDeliveriesSwaggerDocs
  async list(
    @UuidParam('salaId') roomId: string,
    @UuidParam('problemaId') problemId: string,
    @AuthenticatedUser() member: AuthenticatedUserRef,
  ): Promise<ProblemDeliveriesListResponseDto> {
    const result = await this.listDeliveries.execute({ roomId, problemId, member });
    return toProblemDeliveriesListResponse(result);
  }
}
