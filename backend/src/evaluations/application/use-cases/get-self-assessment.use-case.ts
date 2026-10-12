import { Inject, Injectable } from '@nestjs/common';
import { SessionAccessService } from '@/sessions/application/services/session-access.service';
import { UserType } from '@/users/domain/enums/user-type.enum';
import {
  EVALUATION_REPOSITORY,
  type EvaluationRepository,
} from '../../domain/repositories/evaluation.repository';
import {
  studentSelfAssessmentStatus,
  type StudentSelfAssessmentStatus,
} from '../services/student-self-assessment-status';
import { toSelfAssessmentOutput } from '../services/self-assessment-response';

export type { StudentSelfAssessmentStatus } from '../services/student-self-assessment-status';

export interface GetSelfAssessmentOutput {
  status: StudentSelfAssessmentStatus;
  deadline: Date | null;
  submittedAt: Date | null;
  criteria: Array<{ id: string; name: string; weight: number; maxScore: number }>;
  items: Array<{ criterionId: string; score: number }>;
  consolidatedScore?: number;
}

@Injectable()
export class GetSelfAssessmentUseCase {
  constructor(
    private readonly sessionAccess: SessionAccessService,
    @Inject(EVALUATION_REPOSITORY) private readonly evaluations: EvaluationRepository,
  ) {}

  async execute(
    sessionId: string,
    studentId: string,
    now = new Date(),
  ): Promise<GetSelfAssessmentOutput> {
    const access = await this.getMemberAccess(sessionId, studentId);
    return this.loadOutput(sessionId, studentId, access, now);
  }

  private getMemberAccess(sessionId: string, studentId: string) {
    return this.sessionAccess.assertMemberCanAccessSession(sessionId, {
      id: studentId,
      type: UserType.STUDENT,
    });
  }

  private async loadOutput(
    sessionId: string,
    studentId: string,
    access: Awaited<ReturnType<SessionAccessService['assertMemberCanAccessSession']>>,
    now: Date,
  ): Promise<GetSelfAssessmentOutput> {
    const context = { sessionId, problemId: access.problem.id, roomId: access.roomId };
    const [detail, participating] = await Promise.all([
      this.evaluations.getSelfAssessment(context, studentId),
      this.evaluations.isStudentParticipating(sessionId, studentId),
    ]);
    const status = studentSelfAssessmentStatus(
      access.session,
      participating,
      detail.evaluation?.status ?? null,
      now,
    );
    return toSelfAssessmentOutput(status, access.session.selfEvalDeadline, detail);
  }
}
