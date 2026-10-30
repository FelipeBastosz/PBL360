import { Inject, Injectable } from '@nestjs/common';
import { SessionAccessService } from '@/sessions/application/services/session-access.service';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import {
  EVALUATION_REPOSITORY,
  type EvaluationRepository,
} from '../../domain/repositories/evaluation.repository';
import { assertSelfAssessmentCanBeSaved } from '../services/self-assessment-policy';
import { toSelfAssessmentOutput } from '../services/self-assessment-response';
import { studentSelfAssessmentStatus } from '../services/student-self-assessment-status';
import type { GetSelfAssessmentOutput } from './get-self-assessment.use-case';

export interface SaveSelfAssessmentInput {
  sessionId: string;
  studentId: string;
  items: Array<{ criterionId: string; score: number }>;
  submit: boolean;
  notaCargo?: number | null;
  now?: Date;
}

@Injectable()
export class SaveSelfAssessmentUseCase {
  constructor(
    private readonly sessionAccess: SessionAccessService,
    @Inject(EVALUATION_REPOSITORY) private readonly evaluations: EvaluationRepository,
  ) {}

  async execute(input: SaveSelfAssessmentInput): Promise<GetSelfAssessmentOutput> {
    const access = await this.sessionAccess.assertMemberCanAccessSession(input.sessionId, {
      id: input.studentId,
      type: UserType.STUDENT,
    });
    return this.saveWithAccess(input, access);
  }

  private async saveWithAccess(
    input: SaveSelfAssessmentInput,
    access: Awaited<ReturnType<SessionAccessService['assertMemberCanAccessSession']>>,
  ) {
    const context = {
      sessionId: input.sessionId,
      problemId: access.problem.id,
      roomId: access.roomId,
    };
    const detail = await this.evaluations.getSelfAssessment(context, input.studentId);
    const participating = await this.evaluations.isStudentParticipating(
      input.sessionId,
      input.studentId,
    );
    this.assertAllowed(input, access, participating, detail);
    return this.persistAndRespond(input, access, context, participating);
  }

  private assertAllowed(
    input: SaveSelfAssessmentInput,
    access: Awaited<ReturnType<SessionAccessService['assertMemberCanAccessSession']>>,
    participating: boolean,
    detail: Awaited<ReturnType<EvaluationRepository['getSelfAssessment']>>,
  ): void {
    assertSelfAssessmentCanBeSaved(
      access.session,
      participating,
      detail,
      input.items,
      input.submit,
      input.now ?? new Date(),
    );
  }

  private async persistAndRespond(
    input: SaveSelfAssessmentInput,
    access: Awaited<ReturnType<SessionAccessService['assertMemberCanAccessSession']>>,
    context: { sessionId: string; problemId: string; roomId: string },
    participating: boolean,
  ) {
    const saved = await this.evaluations.recordSelfAssessment({
      context,
      studentId: input.studentId,
      items: input.items,
      submit: input.submit,
      notaCargo: input.notaCargo,
    });
    return buildSelfAssessmentResponse(input, access, participating, saved);
  }
}

function buildSelfAssessmentResponse(
  input: SaveSelfAssessmentInput,
  access: Awaited<ReturnType<SessionAccessService['assertMemberCanAccessSession']>>,
  participating: boolean,
  saved: Awaited<ReturnType<EvaluationRepository['recordSelfAssessment']>>,
) {
  const status = studentSelfAssessmentStatus(
    access.session,
    participating,
    saved.evaluation?.status ?? EvaluationStatus.DRAFT,
    input.now ?? new Date(),
  );
  return toSelfAssessmentOutput(status, access.session.selfEvalDeadline, saved);
}
