import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  AuthenticatedUser,
  type AuthenticatedUserRef,
} from '@/shared/decorators/authenticated-user.decorator';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import {
  ReorderPokerQueueDto,
  StartPlanningPokerDto,
} from '../../application/dtos/planning-poker-request.dto';
import type {
  ClosePlanningPokerResponseDto,
  PlanningPokerAvailabilityResponseDto,
  PlanningPokerStateResponseDto,
  PokerQueueResponseDto,
} from '../../application/dtos/planning-poker-response.dto';
import { ClosePlanningPokerUseCase } from '../../application/use-cases/close-planning-poker.use-case';
import { GetPlanningPokerAvailabilityUseCase } from '../../application/use-cases/get-planning-poker-availability.use-case';
import { GetPlanningPokerStateUseCase } from '../../application/use-cases/get-planning-poker-state.use-case';
import { ReorderPokerQueueUseCase } from '../../application/use-cases/reorder-poker-queue.use-case';
import { StartPlanningPokerUseCase } from '../../application/use-cases/start-planning-poker.use-case';
import {
  POKER_ORDER_TO_DOMAIN,
  toAvailabilityResponse,
  toCloseResponse,
  toPlanningPokerStateResponse,
  toTutorStateResponse,
} from './planning-poker.mapper';
import {
  ClosePlanningPokerSwaggerDocs,
  GetPlanningPokerAvailabilitySwaggerDocs,
  GetPlanningPokerStateSwaggerDocs,
  ReorderPokerQueueSwaggerDocs,
  StartPlanningPokerSwaggerDocs,
} from './planning-poker.swagger';

@ApiTags('Planning poker')
@Controller('sessoes/:sessaoId/poker')
export class PlanningPokerController {
  constructor(
    private readonly startPoker: StartPlanningPokerUseCase,
    private readonly getState: GetPlanningPokerStateUseCase,
    private readonly getAvailability: GetPlanningPokerAvailabilityUseCase,
    private readonly reorderQueue: ReorderPokerQueueUseCase,
    private readonly closePoker: ClosePlanningPokerUseCase,
  ) {}

  @Post()
  @Roles(UserType.TUTOR)
  @StartPlanningPokerSwaggerDocs
  async start(
    @UuidParam('sessaoId') sessionId: string,
    @Body() dto: StartPlanningPokerDto,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<PlanningPokerStateResponseDto> {
    const order = POKER_ORDER_TO_DOMAIN[dto.ordem];
    const state = await this.startPoker.execute({
      sessionId,
      tutorId,
      anonymous: dto.anonimo,
      order,
    });
    return toTutorStateResponse(state);
  }

  @Get()
  @GetPlanningPokerStateSwaggerDocs
  async state(
    @UuidParam('sessaoId') sessionId: string,
    @AuthenticatedUser() user: AuthenticatedUserRef,
  ): Promise<PlanningPokerStateResponseDto> {
    return toPlanningPokerStateResponse(await this.getState.execute(sessionId, user));
  }

  @Get('disponibilidade')
  @Roles(UserType.TUTOR)
  @GetPlanningPokerAvailabilitySwaggerDocs
  async availability(
    @UuidParam('sessaoId') sessionId: string,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<PlanningPokerAvailabilityResponseDto> {
    return toAvailabilityResponse(await this.getAvailability.execute(sessionId, tutorId));
  }

  @Put('fila')
  @Roles(UserType.TUTOR)
  @ReorderPokerQueueSwaggerDocs
  async reorder(
    @UuidParam('sessaoId') sessionId: string,
    @Body() dto: ReorderPokerQueueDto,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<PokerQueueResponseDto> {
    return { fila: await this.reorderQueue.execute({ sessionId, tutorId, queue: dto.fila }) };
  }

  @Post('encerrar')
  @HttpCode(HttpStatus.OK)
  @Roles(UserType.TUTOR)
  @ClosePlanningPokerSwaggerDocs
  async close(
    @UuidParam('sessaoId') sessionId: string,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<ClosePlanningPokerResponseDto> {
    return toCloseResponse(await this.closePoker.execute(sessionId, tutorId));
  }
}
