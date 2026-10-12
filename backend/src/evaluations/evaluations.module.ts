import { Module } from '@nestjs/common';
import { SessionsModule } from '@/sessions/sessions.module';
import { FeedbacksModule } from '@/feedbacks/feedbacks.module';
import { EvaluationAccessService } from './application/services/evaluation-access.service';
import { GetProblemEvaluationCriteriaUseCase } from './application/use-cases/get-problem-evaluation-criteria.use-case';
import { ListSessionEvaluationsUseCase } from './application/use-cases/list-session-evaluations.use-case';
import { GetTutorEvaluationUseCase } from './application/use-cases/get-tutor-evaluation.use-case';
import { SaveTutorEvaluationUseCase } from './application/use-cases/save-tutor-evaluation.use-case';
import { ListSessionPeersUseCase } from './application/use-cases/list-session-peers.use-case';
import { GetPeerEvaluationUseCase } from './application/use-cases/get-peer-evaluation.use-case';
import { SavePeerEvaluationUseCase } from './application/use-cases/save-peer-evaluation.use-case';
import { EVALUATION_REPOSITORY } from './domain/repositories/evaluation.repository';
import { PgEvaluationRepository } from './infrastructure/database/pg-evaluation.repository';
import { ProblemEvaluationCriteriaController } from './infrastructure/http/problem-evaluation-criteria.controller';
import { TutorEvaluationsController } from './infrastructure/http/tutor-evaluations.controller';
import { PeerEvaluationsController } from './infrastructure/http/peer-evaluations.controller';
import { StudentEvaluationsController } from './infrastructure/http/student-evaluations.controller';
import { GetSelfAssessmentUseCase } from './application/use-cases/get-self-assessment.use-case';
import { SaveSelfAssessmentUseCase } from './application/use-cases/save-self-assessment.use-case';
import { GetStudentEvaluationSummaryUseCase } from './application/use-cases/get-student-evaluation-summary.use-case';

@Module({
  imports: [SessionsModule, FeedbacksModule],
  controllers: [
    ProblemEvaluationCriteriaController,
    TutorEvaluationsController,
    PeerEvaluationsController,
    StudentEvaluationsController,
  ],
  providers: [
    EvaluationAccessService,
    GetProblemEvaluationCriteriaUseCase,
    ListSessionEvaluationsUseCase,
    GetTutorEvaluationUseCase,
    SaveTutorEvaluationUseCase,
    ListSessionPeersUseCase,
    GetPeerEvaluationUseCase,
    SavePeerEvaluationUseCase,
    GetSelfAssessmentUseCase,
    SaveSelfAssessmentUseCase,
    GetStudentEvaluationSummaryUseCase,
    { provide: EVALUATION_REPOSITORY, useClass: PgEvaluationRepository },
  ],
})
export class EvaluationsModule {}
