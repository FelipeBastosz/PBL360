import { Inject, Injectable } from '@nestjs/common';
import {
  GRADE_RECALCULATION_REPOSITORY,
  type GradeRecalculationRepository,
} from '../../domain/repositories/grade-recalculation.repository';
import type { GradeRecalculationNoticeDto } from '../dtos/grade-recalculation-notice.dto';

@Injectable()
export class ListGradeRecalculationNoticesUseCase {
  constructor(
    @Inject(GRADE_RECALCULATION_REPOSITORY)
    private readonly notices: GradeRecalculationRepository,
  ) {}

  async execute(studentId: string): Promise<GradeRecalculationNoticeDto[]> {
    const notices = await this.notices.findNoticesByStudentId(studentId);
    return notices.map((notice) => ({
      id: notice.id,
      sessaoId: notice.sessionId,
      sessao: notice.sessionTitle,
      notaAnterior: notice.previousScore,
      notaAtualizada: notice.newScore,
      motivo: toReasonMessage(notice.reasonCode),
      criadoEm: notice.createdAt,
    }));
  }
}

function toReasonMessage(reasonCode: string): string {
  if (reasonCode === 'CRITERION_WEIGHTS_CHANGED') {
    return 'Nota recalculada devido à alteração dos pesos dos critérios de avaliação.';
  }
  return 'Nota recalculada por uma alteração na avaliação.';
}
