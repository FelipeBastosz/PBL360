import { Module } from '@nestjs/common';
import { SessionsModule } from '@/sessions/sessions.module';
import { UsersModule } from '@/users/users.module';
import { POKER_EVENT_PUBLISHER } from './application/services/poker-event-publisher';
import { PokerContextService } from './application/services/poker-context.service';
import { PokerStateService } from './application/services/poker-state.service';
import { CancelPokerRoundUseCase } from './application/use-cases/cancel-poker-round.use-case';
import { CastPokerVoteUseCase } from './application/use-cases/cast-poker-vote.use-case';
import { ClosePlanningPokerUseCase } from './application/use-cases/close-planning-poker.use-case';
import { DecidePokerRoundUseCase } from './application/use-cases/decide-poker-round.use-case';
import { GetPlanningPokerAvailabilityUseCase } from './application/use-cases/get-planning-poker-availability.use-case';
import { GetPlanningPokerStateUseCase } from './application/use-cases/get-planning-poker-state.use-case';
import { OpenPokerRoundUseCase } from './application/use-cases/open-poker-round.use-case';
import { ReorderPokerQueueUseCase } from './application/use-cases/reorder-poker-queue.use-case';
import { RestartPokerVotingUseCase } from './application/use-cases/restart-poker-voting.use-case';
import { RevealPokerRoundUseCase } from './application/use-cases/reveal-poker-round.use-case';
import { StartPlanningPokerUseCase } from './application/use-cases/start-planning-poker.use-case';
import { PLANNING_POKER_REPOSITORY } from './domain/repositories/planning-poker.repository';
import { POKER_ROUND_REPOSITORY } from './domain/repositories/poker-round.repository';
import { PgPlanningPokerRepository } from './infrastructure/database/pg-planning-poker.repository';
import { PgPokerRoundRepository } from './infrastructure/database/pg-poker-round.repository';
import { PlanningPokerController } from './infrastructure/http/planning-poker.controller';
import { PokerRoundsController } from './infrastructure/http/poker-rounds.controller';
import { PlanningPokerGateway } from './infrastructure/realtime/planning-poker.gateway';
import { PokerSocketAuthenticator } from './infrastructure/realtime/poker-socket-authenticator';

@Module({
  imports: [SessionsModule, UsersModule],
  controllers: [PlanningPokerController, PokerRoundsController],
  providers: [
    PokerContextService,
    PokerStateService,
    StartPlanningPokerUseCase,
    GetPlanningPokerStateUseCase,
    GetPlanningPokerAvailabilityUseCase,
    ReorderPokerQueueUseCase,
    OpenPokerRoundUseCase,
    CancelPokerRoundUseCase,
    CastPokerVoteUseCase,
    RevealPokerRoundUseCase,
    RestartPokerVotingUseCase,
    DecidePokerRoundUseCase,
    ClosePlanningPokerUseCase,
    PokerSocketAuthenticator,
    PlanningPokerGateway,
    { provide: POKER_EVENT_PUBLISHER, useExisting: PlanningPokerGateway },
    { provide: PLANNING_POKER_REPOSITORY, useClass: PgPlanningPokerRepository },
    { provide: POKER_ROUND_REPOSITORY, useClass: PgPokerRoundRepository },
  ],
})
export class PlanningPokerModule {}
