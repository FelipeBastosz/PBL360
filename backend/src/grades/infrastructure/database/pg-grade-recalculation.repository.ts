import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';
import type {
  GradeRecalculationNotice,
  GradeRecalculationRepository,
} from '../../domain/repositories/grade-recalculation.repository';

@Injectable()
export class PgGradeRecalculationRepository implements GradeRecalculationRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  findNoticesByStudentId(studentId: string): Promise<GradeRecalculationNotice[]> {
    return this.dataSource.query<GradeRecalculationNotice[]>(
      `SELECT history.id,
              history.session_id AS "sessionId",
              sessions.title AS "sessionTitle",
              history.previous_score::float AS "previousScore",
              history.new_score::float AS "newScore",
              history.reason_code AS "reasonCode",
              history.created_at AS "createdAt"
         FROM grade_recalculation_history history
         JOIN sessions ON sessions.id = history.session_id
        WHERE history.student_id = $1
        ORDER BY history.created_at DESC, history.id DESC
        LIMIT 100;`,
      [studentId],
    );
  }
}
