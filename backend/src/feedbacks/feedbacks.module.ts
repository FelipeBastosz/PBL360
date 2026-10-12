import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomsModule } from '@/rooms/rooms.module';
import { ProblemsModule } from '@/problems/problems.module';
import { SessionsModule } from '@/sessions/sessions.module';
import { Feedback } from './domain/entities/feedback.entity';
import { FeedbackRevision } from './domain/entities/feedback-revision.entity';
import { FEEDBACK_REPOSITORY } from './domain/repositories/feedback.repository';
import { PgFeedbackRepository } from './infrastructure/database/pg-feedback.repository';
import { RoomFeedbacksController } from './infrastructure/http/room-feedbacks.controller';
import { SessionFeedbacksController } from './infrastructure/http/session-feedbacks.controller';
import { FeedbackRevisionsController } from './infrastructure/http/feedback-revisions.controller';
import { SaveStudentProblemFeedbackUseCase } from './application/use-cases/save-student-problem-feedback.use-case';
import { SaveGeneralProblemFeedbackUseCase } from './application/use-cases/save-general-problem-feedback.use-case';
import { GetProblemFeedbacksUseCase } from './application/use-cases/get-problem-feedbacks.use-case';
import { SaveSessionFeedbackUseCase } from './application/use-cases/save-session-feedback.use-case';
import { GetSessionFeedbackUseCase } from './application/use-cases/get-session-feedback.use-case';
import { GetFeedbackRevisionsUseCase } from './application/use-cases/get-feedback-revisions.use-case';

import { FeedbackView } from './domain/entities/feedback-view.entity';
import { RECEIVED_FEEDBACK_REPOSITORY } from './domain/repositories/received-feedback.repository';
import { PgReceivedFeedbackRepository } from './infrastructure/database/pg-received-feedback.repository';
import { GetMySessionFeedbackUseCase } from './application/use-cases/get-my-session-feedback.use-case';
import { GetMyProblemFeedbacksUseCase } from './application/use-cases/get-my-problem-feedbacks.use-case';
import { MySessionFeedbackController } from './infrastructure/http/my-session-feedback.controller';
import { MyProblemFeedbacksController } from './infrastructure/http/my-problem-feedbacks.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Feedback, FeedbackRevision, FeedbackView]),
    RoomsModule,
    ProblemsModule,
    SessionsModule,
  ],
  controllers: [
    MySessionFeedbackController,
    MyProblemFeedbacksController,
    RoomFeedbacksController,
    SessionFeedbacksController,
    FeedbackRevisionsController,
  ],
  providers: [
    GetMySessionFeedbackUseCase,
    GetMyProblemFeedbacksUseCase,
    { provide: RECEIVED_FEEDBACK_REPOSITORY, useClass: PgReceivedFeedbackRepository },
    SaveStudentProblemFeedbackUseCase,
    SaveGeneralProblemFeedbackUseCase,
    GetProblemFeedbacksUseCase,
    SaveSessionFeedbackUseCase,
    GetSessionFeedbackUseCase,
    GetFeedbackRevisionsUseCase,
    {
      provide: FEEDBACK_REPOSITORY,
      useClass: PgFeedbackRepository,
    },
  ],
  exports: [FEEDBACK_REPOSITORY],
})
export class FeedbacksModule {}
