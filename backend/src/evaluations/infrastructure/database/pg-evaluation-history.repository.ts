import { Injectable } from '@nestjs/common';
import { DataSource, type EntityManager } from 'typeorm';
import type { Session } from '@/sessions/domain/entities/session.entity';
import type { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import type {
  SessionEvaluationHistoryItem,
  StudentSessionEvaluationComparison,
} from '../../domain/entities/evaluation-history.entity';
import type { EvaluationHistoryRepository } from '../../domain/repositories/evaluation-history.repository';
import { studentSelfAssessmentStatus } from '../../application/services/student-self-assessment-status';
import {
  readHistoryConfig,
  readParticipatingStatus,
  readParticipatingStudents,
  readPeerItemRows,
  readReceivedPeerEvaluations,
  readSessionAdjustments,
  readSessionPeerEvaluations,
  readSessionSelfEvaluations,
  readSessionTiming,
  readSessionTutorScores,
  readStudentParticipant,
  readStudentSelfAdjustments,
  readStudentSelfEvaluation,
  readStudentTutorScores,
} from './evaluation-history.reads';
import {
  buildComparisonAdjustments,
  buildComparisonCriteriaItens,
  buildComparisonPeers,
  buildHistoryStudentItem,
} from './evaluation-history-builder';
import type { SelfEvaluationRow, StudentRow } from './evaluation-history.types';
import { FIND_EVALUATION_ITEMS_QUERY } from './evaluation-history.queries';
import { mapAdjustments, mapPeers, mapSelf, mapTutors } from './evaluation-history.maps';

@Injectable()
export class PgEvaluationHistoryRepository implements EvaluationHistoryRepository {
  constructor(private readonly dataSource: DataSource) {}

  isStudentParticipating(sessionId: string, studentId: string): Promise<boolean> {
    return readParticipatingStatus(this.dataSource.manager, sessionId, studentId);
  }

  async getHistory(sessionId: string): Promise<SessionEvaluationHistoryItem[]> {
    return this.dataSource.transaction('REPEATABLE READ', async (manager) => {
      const students = await readParticipatingStudents(manager, sessionId);
      if (students.length === 0) return [];
      const config = await readHistoryConfig(manager, sessionId);
      const maps = await this.loadHistoryMaps(manager, sessionId);
      return students.map((student) => buildHistoryStudentItem(student, config.criteria, maps));
    });
  }

  async getStudentComparison(
    sessionId: string,
    studentId: string,
  ): Promise<StudentSessionEvaluationComparison | null> {
    return this.dataSource.transaction('REPEATABLE READ', (manager) =>
      this.fetchStudentComparison(manager, sessionId, studentId),
    );
  }

  private async fetchStudentComparison(
    manager: EntityManager,
    sessionId: string,
    studentId: string,
  ): Promise<StudentSessionEvaluationComparison | null> {
    const student = await readStudentParticipant(manager, sessionId, studentId);
    if (!student) return null;
    const [selfData, tutorScores, peerData, config] = await this.loadComparisonBundles(
      manager,
      sessionId,
      studentId,
    );
    return this.assembleStudentComparison(
      student,
      config.criteria,
      selfData,
      tutorScores,
      peerData,
    );
  }

  private loadComparisonBundles(manager: EntityManager, sessionId: string, studentId: string) {
    return Promise.all([
      this.loadStudentSelfData(manager, sessionId, studentId),
      this.loadTutorScores(manager, sessionId, studentId),
      this.loadStudentPeerData(manager, sessionId, studentId),
      readHistoryConfig(manager, sessionId),
    ]);
  }

  private async loadStudentSelfData(manager: EntityManager, sessionId: string, studentId: string) {
    const timing = await readSessionTiming(manager, sessionId);
    const selfEval = await readStudentSelfEvaluation(manager, sessionId, studentId);
    const selfScores = await this.loadSelfScores(manager, selfEval);
    const adjustments = selfEval ? await readStudentSelfAdjustments(manager, selfEval.id) : [];
    const status = studentSelfAssessmentStatus(
      {
        selfEvalReleased: Boolean(timing?.selfEvalReleased),
        selfEvalDeadline: timing?.selfEvalDeadline ? new Date(timing.selfEvalDeadline) : null,
      } as Session,
      true,
      selfEval?.status ? (selfEval.status as EvaluationStatus) : null,
      new Date(),
    );
    return { selfEval, selfScores, adjustments, status };
  }

  private async loadStudentPeerData(manager: EntityManager, sessionId: string, studentId: string) {
    const peerRows = await readReceivedPeerEvaluations(manager, sessionId, studentId);
    const peerItemsMap = await readPeerItemRows(
      manager,
      peerRows.map((p) => p.id),
    );
    return { peerRows, peerItemsMap };
  }

  private assembleSelfAssessment(
    selfData: Awaited<ReturnType<typeof this.loadStudentSelfData>>,
    criteria: Array<{ id: string; name: string }>,
    tutorScores: Map<string, number>,
  ) {
    const { selfEval, selfScores, status } = selfData;
    const isSubmitted = selfEval?.status === 'SUBMITTED';
    const score =
      isSubmitted && selfEval.sessionScore !== null ? Number(selfEval.sessionScore) : null;
    return {
      status,
      enviadaEm: isSubmitted ? selfEval.submittedAt : null,
      notaConsolidada: score,
      itens: buildComparisonCriteriaItens(criteria, selfScores, tutorScores),
    };
  }

  private assembleStudentComparison(
    student: StudentRow,
    criteria: Array<{ id: string; name: string }>,
    selfData: Awaited<ReturnType<typeof this.loadStudentSelfData>>,
    tutorScores: Map<string, number>,
    peerData: Awaited<ReturnType<typeof this.loadStudentPeerData>>,
  ): StudentSessionEvaluationComparison {
    return {
      aluno: { alunoId: student.alunoId, nome: student.nome },
      autoavaliacao: this.assembleSelfAssessment(selfData, criteria, tutorScores),
      pares: buildComparisonPeers(peerData.peerRows, peerData.peerItemsMap),
      ajustes: buildComparisonAdjustments(selfData.adjustments),
    };
  }

  private async loadHistoryMaps(manager: EntityManager, sessionId: string) {
    const [selfEvals, adjustments, peers, tutorScores] = await Promise.all([
      readSessionSelfEvaluations(manager, sessionId),
      readSessionAdjustments(manager, sessionId),
      readSessionPeerEvaluations(manager, sessionId),
      readSessionTutorScores(manager, sessionId),
    ]);
    return {
      selfMap: mapSelf(selfEvals),
      adjustmentMap: mapAdjustments(adjustments),
      peerMap: mapPeers(peers),
      tutorMap: mapTutors(tutorScores),
    };
  }

  private async loadSelfScores(manager: EntityManager, selfEval: SelfEvaluationRow | null) {
    const map = new Map<string, number>();
    if (!selfEval || selfEval.status !== 'SUBMITTED') return map;
    const items = await manager.query<Array<{ criterionId: string; score: string | number }>>(
      FIND_EVALUATION_ITEMS_QUERY,
      [selfEval.id],
    );
    for (const item of items) map.set(item.criterionId, Number(item.score));
    return map;
  }

  private async loadTutorScores(manager: EntityManager, sessionId: string, studentId: string) {
    const map = new Map<string, number>();
    const rows = await readStudentTutorScores(manager, sessionId, studentId);
    for (const row of rows) map.set(row.criterionId, Number(row.score));
    return map;
  }
}
