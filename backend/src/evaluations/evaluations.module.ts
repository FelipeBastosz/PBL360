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
import { SELF_ASSESSMENT_ADJUSTMENT_REPOSITORY } from './domain/repositories/self-assessment-adjustment.repository';
import { PgSelfAssessmentAdjustmentRepository } from './infrastructure/database/pg-self-assessment-adjustment.repository';
import { ProblemEvaluationCriteriaController } from './infrastructure/http/problem-evaluation-criteria.controller';
import { TutorEvaluationsController } from './infrastructure/http/tutor-evaluations.controller';
import { PeerEvaluationsController } from './infrastructure/http/peer-evaluations.controller';
import { StudentEvaluationsController } from './infrastructure/http/student-evaluations.controller';
import { GetSelfAssessmentUseCase } from './application/use-cases/get-self-assessment.use-case';
import { SaveSelfAssessmentUseCase } from './application/use-cases/save-self-assessment.use-case';
import { GetStudentEvaluationSummaryUseCase } from './application/use-cases/get-student-evaluation-summary.use-case';
import { AdjustSelfAssessmentUseCase } from './application/use-cases/adjust-self-assessment.use-case';
import { ListSelfAssessmentAdjustmentsUseCase } from './application/use-cases/list-self-assessment-adjustments.use-case';
import { SelfAssessmentAdjustmentsController } from './infrastructure/http/self-assessment-adjustments.controller';
import { EvaluationHistoryController } from './infrastructure/http/evaluation-history.controller';
import { GetSessionEvaluationHistoryUseCase } from './application/use-cases/get-session-evaluation-history.use-case';
import { GetStudentSessionEvaluationComparisonUseCase } from './application/use-cases/get-student-session-evaluation-comparison.use-case';
import { EVALUATION_HISTORY_REPOSITORY } from './domain/repositories/evaluation-history.repository';
import { PgEvaluationHistoryRepository } from './infrastructure/database/pg-evaluation-history.repository';

@Module({
  imports: [SessionsModule, FeedbacksModule],
  controllers: [
    ProblemEvaluationCriteriaController,
    TutorEvaluationsController,
    PeerEvaluationsController,
    StudentEvaluationsController,
    SelfAssessmentAdjustmentsController,
    EvaluationHistoryController,
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
    AdjustSelfAssessmentUseCase,
    ListSelfAssessmentAdjustmentsUseCase,
    GetSessionEvaluationHistoryUseCase,
    GetStudentSessionEvaluationComparisonUseCase,
    { provide: EVALUATION_REPOSITORY, useClass: PgEvaluationRepository },
    {
      provide: SELF_ASSESSMENT_ADJUSTMENT_REPOSITORY,
      useClass: PgSelfAssessmentAdjustmentRepository,
    },
    {
      provide: EVALUATION_HISTORY_REPOSITORY,
      useClass: PgEvaluationHistoryRepository,
    },
  ],
})
export class EvaluationsModule {}
