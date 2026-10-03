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

@Module({
  imports: [
    TypeOrmModule.forFeature([Feedback, FeedbackRevision]),
    RoomsModule,
    ProblemsModule,
    SessionsModule,
  ],
  controllers: [RoomFeedbacksController, SessionFeedbacksController, FeedbackRevisionsController],
  providers: [
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
