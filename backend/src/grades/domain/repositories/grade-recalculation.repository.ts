export interface GradeRecalculationNotice {
  id: string;
  sessionId: string;
  sessionTitle: string;
  previousScore: number;
  newScore: number;
  reasonCode: string;
  createdAt: Date;
}

export interface GradeRecalculationRepository {
  findNoticesByStudentId(studentId: string): Promise<GradeRecalculationNotice[]>;
}

export const GRADE_RECALCULATION_REPOSITORY = Symbol('GRADE_RECALCULATION_REPOSITORY');
