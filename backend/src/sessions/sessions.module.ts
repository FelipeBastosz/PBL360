import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProblemsModule } from '@/problems/problems.module';
import { RoomsModule } from '@/rooms/rooms.module';
import { CreateSessionUseCase } from './application/use-cases/create-session.use-case';
import { DeleteSessionUseCase } from './application/use-cases/delete-session.use-case';
import { GetSessionDeletionImpactUseCase } from './application/use-cases/get-session-deletion-impact.use-case';
import { GetSessionUseCase } from './application/use-cases/get-session.use-case';
import { ListSessionsUseCase } from './application/use-cases/list-sessions.use-case';
import { UpdateSessionUseCase } from './application/use-cases/update-session.use-case';
import { SessionAccessService } from './application/services/session-access.service';
import { Session } from './domain/entities/session.entity';
import { SESSION_REPOSITORY } from './domain/repositories/session.repository';
import { PgSessionRepository } from './infrastructure/database/pg-session.repository';
import { SessionsController } from './infrastructure/http/sessions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Session]), RoomsModule, ProblemsModule],
  controllers: [SessionsController],
  providers: [
    CreateSessionUseCase,
    ListSessionsUseCase,
    GetSessionUseCase,
    UpdateSessionUseCase,
    GetSessionDeletionImpactUseCase,
    DeleteSessionUseCase,
    SessionAccessService,
    { provide: SESSION_REPOSITORY, useClass: PgSessionRepository },
  ],
  exports: [SESSION_REPOSITORY, SessionAccessService],
})
export class SessionsModule {}
