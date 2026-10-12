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
import { SessionAttachment } from './domain/entities/session-attachment.entity';
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
import { RollCallController } from './infrastructure/http/roll-call.controller';
import { GetRollCallUseCase } from './application/use-cases/get-roll-call.use-case';
import { RecordRollCallUseCase } from './application/use-cases/record-roll-call.use-case';
import { ATTENDANCE_REPOSITORY } from './domain/repositories/attendance.repository';
import { PgAttendanceRepository } from './infrastructure/database/pg-attendance.repository';
import { MemberSessionsController } from './infrastructure/http/member-sessions.controller';
import { ListRoomSessionsUseCase } from './application/use-cases/list-room-sessions.use-case';
import { GetMemberSessionUseCase } from './application/use-cases/get-member-session.use-case';
import { ROOM_SESSION_REPOSITORY } from './domain/repositories/room-session.repository';
import { PgRoomSessionRepository } from './infrastructure/database/pg-room-session.repository';
import { SessionAttachmentsController } from './infrastructure/http/session-attachments.controller';
import { UploadSessionAttachmentUseCase } from './application/use-cases/upload-session-attachment.use-case';
import { ListSessionAttachmentsUseCase } from './application/use-cases/list-session-attachments.use-case';
import { DeleteSessionAttachmentUseCase } from './application/use-cases/delete-session-attachment.use-case';
import { DownloadSessionAttachmentUseCase } from './application/use-cases/download-session-attachment.use-case';
import { GetEvaluationReleasesUseCase } from './application/use-cases/get-evaluation-releases.use-case';
import { UpdateEvaluationReleasesUseCase } from './application/use-cases/update-evaluation-releases.use-case';
import { EvaluationReleasesController } from './infrastructure/http/evaluation-releases.controller';
import { SESSION_ATTACHMENT_REPOSITORY } from './domain/repositories/session-attachment.repository';
import { PgSessionAttachmentRepository } from './infrastructure/database/pg-session-attachment.repository';
import { SessionEvaluationConfigurationController } from './infrastructure/http/session-evaluation-configuration.controller';
import { SessionEvaluationConfigurationService } from './application/services/session-evaluation-configuration.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session, SessionRoleAssignment, Attendance, SessionAttachment]),
    RoomsModule,
    ProblemsModule,
  ],
  controllers: [
    SessionsController,
    SessionRolesController,
    RollCallController,
    MemberSessionsController,
    SessionAttachmentsController,
    EvaluationReleasesController,
    SessionEvaluationConfigurationController,
  ],
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
    GetRollCallUseCase,
    RecordRollCallUseCase,
    ListRoomSessionsUseCase,
    GetMemberSessionUseCase,
    UploadSessionAttachmentUseCase,
    ListSessionAttachmentsUseCase,
    DownloadSessionAttachmentUseCase,
    DeleteSessionAttachmentUseCase,
    GetEvaluationReleasesUseCase,
    UpdateEvaluationReleasesUseCase,
    SessionEvaluationConfigurationService,
    { provide: SESSION_REPOSITORY, useClass: PgSessionRepository },
    { provide: SESSION_ROLE_REPOSITORY, useClass: PgSessionRoleRepository },
    { provide: ATTENDANCE_REPOSITORY, useClass: PgAttendanceRepository },
    { provide: ROOM_SESSION_REPOSITORY, useClass: PgRoomSessionRepository },
    { provide: SESSION_ATTACHMENT_REPOSITORY, useClass: PgSessionAttachmentRepository },
  ],
  exports: [SESSION_REPOSITORY, SessionAccessService],
})
export class SessionsModule {}
