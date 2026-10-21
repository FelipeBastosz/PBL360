import { Injectable } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import { DataSource } from 'typeorm';
import { readEvaluationSummaries } from '@/evaluations/infrastructure/database/evaluation-summary.reads';
import type {
  SessionReportData,
  SessionReportRepository,
} from '../../domain/repositories/session-report.repository';
import {
  FIND_ROOM_STUDENTS_QUERY,
  FIND_SESSION_ATTENDANCES_QUERY,
  FIND_SESSION_EVALUATIONS_QUERY,
  FIND_SESSION_FEEDBACKS_QUERY,
  FIND_SESSION_HEADER_QUERY,
  FIND_SESSION_OBSERVATION_TAGS_QUERY,
  FIND_SESSION_ROLES_QUERY,
} from './session-report.queries';
import {
  buildSessionReportData,
  type AttendanceRow,
  type EvaluationRow,
  type FeedbackRow,
  type HeaderRow,
  type ObservationTagsRow,
  type RoleRow,
  type SessionReportRawData,
  type StudentRow,
} from './session-report.mapper';

function queryReportParts(manager: EntityManager, sessionId: string, roomId: string) {
  return Promise.all([
    manager.query<HeaderRow[]>(FIND_SESSION_HEADER_QUERY, [sessionId]),
    manager.query<StudentRow[]>(FIND_ROOM_STUDENTS_QUERY, [roomId]),
    manager.query<AttendanceRow[]>(FIND_SESSION_ATTENDANCES_QUERY, [sessionId]),
    manager.query<RoleRow[]>(FIND_SESSION_ROLES_QUERY, [sessionId]),
    manager.query<ObservationTagsRow[]>(FIND_SESSION_OBSERVATION_TAGS_QUERY, [sessionId]),
    manager.query<EvaluationRow[]>(FIND_SESSION_EVALUATIONS_QUERY, [sessionId]),
    manager.query<FeedbackRow[]>(FIND_SESSION_FEEDBACKS_QUERY, [sessionId]),
    readEvaluationSummaries(manager, { roomId, sessionId, problemId: '' }),
  ]);
}

function buildRawData(
  sessionId: string,
  roomId: string,
  p: Awaited<ReturnType<typeof queryReportParts>>,
): SessionReportRawData {
  return {
    header: p[0][0],
    sessionId,
    roomId,
    students: p[1],
    attendances: p[2],
    roles: p[3],
    observations: p[4],
    evaluations: p[5],
    feedbacks: p[6],
    summaries: p[7],
  };
}

@Injectable()
export class PgSessionReportRepository implements SessionReportRepository {
  constructor(private readonly dataSource: DataSource) {}

  async getSessionReportData(sessionId: string, roomId: string): Promise<SessionReportData> {
    return this.dataSource.transaction('REPEATABLE READ', async (manager) => {
      const parts = await queryReportParts(manager, sessionId, roomId);
      return buildSessionReportData(buildRawData(sessionId, roomId, parts));
    });
  }
}
