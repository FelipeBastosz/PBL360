import { Injectable } from '@nestjs/common';
import { DataSource, type EntityManager } from 'typeorm';
import type {
  SessionReportData,
  SessionReportRepository,
} from '../../domain/repositories/session-report.repository';
import {
  FIND_ROOM_STUDENTS_QUERY,
  FIND_SESSION_ATTENDANCES_QUERY,
  FIND_SESSION_EVALUATION_ITEMS_QUERY,
  FIND_SESSION_EVALUATIONS_QUERY,
  FIND_SESSION_FEEDBACKS_QUERY,
  FIND_SESSION_FORMULA_COMPONENTS_QUERY,
  FIND_SESSION_HEADER_QUERY,
  FIND_SESSION_OBSERVATION_TAGS_QUERY,
  FIND_SESSION_ROLES_QUERY,
  FIND_SNAPSHOT_CRITERIA_QUERY,
  FIND_TABLE_CRITERIA_QUERY,
} from './session-report.queries';
import {
  buildSessionReportData,
  type CriterionRow,
  type EvaluationItemRow,
  type EvaluationRow,
  type FeedbackRow,
  type FormulaComponentRow,
  type HeaderRow,
  type ObservationTagsRow,
  type RoleRow,
  type StudentRow,
  type AttendanceRow,
} from './session-report.mapper';

@Injectable()
export class PgSessionReportRepository implements SessionReportRepository {
  constructor(private readonly dataSource: DataSource) {}

  async getSessionReportData(sessionId: string, roomId: string): Promise<SessionReportData> {
    return this.dataSource.transaction('REPEATABLE READ', async (manager) => {
      const base = await this.queryBaseData(manager, sessionId, roomId);
      const criteria = await this.queryCriteria(manager, sessionId);
      const formulas = await manager.query<FormulaComponentRow[]>(
        FIND_SESSION_FORMULA_COMPONENTS_QUERY,
        [sessionId],
      );
      const items = await this.queryEvaluationItems(manager, sessionId, base.evaluations);

      return buildSessionReportData({
        ...base,
        sessionId,
        roomId,
        criteria,
        formulas,
        items,
      });
    });
  }

  private async queryEntities(manager: EntityManager, sessionId: string, roomId: string) {
    const [headerRows, students, attendances, roles] = await Promise.all([
      manager.query<HeaderRow[]>(FIND_SESSION_HEADER_QUERY, [sessionId]),
      manager.query<StudentRow[]>(FIND_ROOM_STUDENTS_QUERY, [roomId]),
      manager.query<AttendanceRow[]>(FIND_SESSION_ATTENDANCES_QUERY, [sessionId]),
      manager.query<RoleRow[]>(FIND_SESSION_ROLES_QUERY, [sessionId]),
    ]);
    return { header: headerRows[0], students, attendances, roles };
  }

  private async queryActivities(manager: EntityManager, sessionId: string) {
    const [observations, evaluations, feedbacks] = await Promise.all([
      manager.query<ObservationTagsRow[]>(FIND_SESSION_OBSERVATION_TAGS_QUERY, [sessionId]),
      manager.query<EvaluationRow[]>(FIND_SESSION_EVALUATIONS_QUERY, [sessionId]),
      manager.query<FeedbackRow[]>(FIND_SESSION_FEEDBACKS_QUERY, [sessionId]),
    ]);
    return { observations, evaluations, feedbacks };
  }

  private async queryBaseData(manager: EntityManager, sessionId: string, roomId: string) {
    const [entities, activities] = await Promise.all([
      this.queryEntities(manager, sessionId, roomId),
      this.queryActivities(manager, sessionId),
    ]);
    return { ...entities, ...activities };
  }

  private async queryCriteria(manager: EntityManager, sessionId: string) {
    const snapshot = await manager.query<CriterionRow[]>(FIND_SNAPSHOT_CRITERIA_QUERY, [sessionId]);
    if (snapshot.length > 0) return snapshot;
    return manager.query<CriterionRow[]>(FIND_TABLE_CRITERIA_QUERY, [sessionId]);
  }

  private async queryEvaluationItems(
    manager: EntityManager,
    sessionId: string,
    evaluations: EvaluationRow[],
  ): Promise<EvaluationItemRow[]> {
    if (evaluations.length === 0) return [];
    return manager.query<EvaluationItemRow[]>(FIND_SESSION_EVALUATION_ITEMS_QUERY, [sessionId]);
  }
}
