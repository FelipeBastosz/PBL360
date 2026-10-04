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
import { Attendance } from './domain/entities/attendance.entity';
import { Session } from './domain/entities/session.entity';
import { SessionRoleAssignment } from './domain/entities/session-role.entity';
import { SESSION_ROLE_REPOSITORY } from './domain/repositories/session-role.repository';
import { PgSessionRoleRepository } from './infrastructure/database/pg-session-role.repository';
import { ListSessionRolesUseCase } from './application/use-cases/list-session-roles.use-case';
import { AssignSessionRoleUseCase } from './application/use-cases/assign-session-role.use-case';
import { SESSION_REPOSITORY } from './domain/repositories/session.repository';
import { PgSessionRepository } from './infrastructure/database/pg-session.repository';
import { SessionsController } from './infrastructure/http/sessions.controller';
import { SessionRolesController } from './infrastructure/http/session-roles.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session, SessionRoleAssignment, Attendance]),
    RoomsModule,
    ProblemsModule,
  ],
  controllers: [SessionsController, SessionRolesController],
  providers: [
    CreateSessionUseCase,
    ListSessionsUseCase,
    GetSessionUseCase,
    UpdateSessionUseCase,
    GetSessionDeletionImpactUseCase,
    DeleteSessionUseCase,
    SessionAccessService,
    ListSessionRolesUseCase,
    AssignSessionRoleUseCase,
    { provide: SESSION_REPOSITORY, useClass: PgSessionRepository },
    { provide: SESSION_ROLE_REPOSITORY, useClass: PgSessionRoleRepository },
  ],
  exports: [SESSION_REPOSITORY, SessionAccessService],
})
export class SessionsModule {}
