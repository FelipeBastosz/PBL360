import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Problem } from '@/problems/domain/entities/problem.entity';
import { PerformanceTable } from '@/performance-tables/domain/entities/performance-table.entity';
import { User } from '@/users/domain/entities/user.entity';
import { InvalidSessionError } from '../errors/invalid-session.error';
import type { EvaluationReleaseChange, EvaluationReleaseKind } from './evaluation-release';

@Entity('sessions')
@Unique('uq_sessions_problem_order', ['problemId', 'orderIndex'])
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'problem_id', type: 'uuid' })
  @Index('idx_sessions_problem_id')
  problemId: string;

  @ManyToOne(() => Problem, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'problem_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_sessions_problem',
  })
  problem: Problem;

  createdBy: string;

  @Column({ name: 'performance_table_id', type: 'uuid' })
  @Index('idx_sessions_performance_table_id')
  performanceTableId: string;

  @ManyToOne(() => PerformanceTable, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'performance_table_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_sessions_performance_table',
  })
  performanceTable: PerformanceTable;

  @Column({ type: 'varchar', length: 120 })
  title: string;

  @Column({ type: 'text', nullable: true, default: null })
  description: string | null;

  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'order_index', type: 'smallint', default: 1 })
  orderIndex: number;

  @Column({ type: 'varchar', length: 30, default: 'agendada' })
  status: string;

  @Column({ name: 'self_eval_released', type: 'boolean', default: false })
  selfEvalReleased: boolean;

  @Column({ name: 'peer_eval_released', type: 'boolean', default: false })
  peerEvalReleased: boolean;

  @Column({ name: 'self_eval_deadline', type: 'timestamptz', nullable: true, default: null })
  selfEvalDeadline: Date | null;

  @Column({ name: 'peer_eval_deadline', type: 'timestamptz', nullable: true, default: null })
  peerEvalDeadline: Date | null;

  @Column({ name: 'released_at', type: 'timestamptz', nullable: true, default: null })
  releasedAt: Date | null;

  @Column({ name: 'released_by', type: 'uuid', nullable: true, default: null })
  releasedBy: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({
    name: 'released_by',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_sessions_released_by',
  })
  releaser?: User | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  static create(props: NewSession): Session {
    const session = new Session();
    session.problemId = props.problemId;
    session.createdBy = props.createdBy;
    session.performanceTableId = '';
    session.title = props.title.trim();
    session.description = props.description?.trim() || null;
    session.date = props.date;
    session.orderIndex = 1;
    session.status = 'agendada';
    session.selfEvalReleased = false;
    session.peerEvalReleased = false;
    session.selfEvalDeadline = null;
    session.peerEvalDeadline = null;
    session.releasedAt = null;
    session.releasedBy = null;
    return session;
  }

  update(title: string, description: string | null, date: string): void {
    this.title = title.trim();
    this.description = description?.trim() || null;
    this.date = date;
  }

  changeRelease(
    kind: EvaluationReleaseKind,
    change: EvaluationReleaseChange,
    authorId: string,
    now = new Date(),
  ): void {
    if (change.deadline && change.deadline <= now) {
      throw new InvalidSessionError('O prazo deve ser uma data no futuro.');
    }

    if (kind === 'self') {
      this.selfEvalReleased = change.released;
      this.selfEvalDeadline = change.deadline;
    } else {
      this.peerEvalReleased = change.released;
      this.peerEvalDeadline = change.deadline;
    }

    this.releasedAt = now;
    this.releasedBy = authorId;
  }

  isReleaseOpen(kind: EvaluationReleaseKind, now = new Date()): boolean {
    const released = kind === 'self' ? this.selfEvalReleased : this.peerEvalReleased;
    const deadline = kind === 'self' ? this.selfEvalDeadline : this.peerEvalDeadline;

    return released && (!deadline || deadline > now);
  }
}

export interface NewSession {
  problemId: string;
  createdBy: string;
  title: string;
  description: string | null;
  date: string;
}
