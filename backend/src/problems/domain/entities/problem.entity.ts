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
import { PerformanceTable } from '@/performance-tables/domain/entities/performance-table.entity';
import { Room } from '@/rooms/domain/entities/room.entity';
import { User } from '@/users/domain/entities/user.entity';
import type { Auditable } from '@/shared/interfaces/auditable.interface';
import { InvalidProblemError } from '../errors/invalid-problem.error';
import type { EvaluationReleaseChange, EvaluationReleaseKind } from './evaluation-release';
import type { NewProblem } from './new-problem';

@Entity('problems')
@Unique('uq_problems_room_order', ['roomId', 'orderIndex'])
export class Problem implements Auditable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'room_id', type: 'uuid' })
  roomId: string;

  @ManyToOne(() => Room, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'room_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_problems_room',
  })
  room: Room;

  @Column({ type: 'varchar', length: 120 })
  title: string;

  @Column({ type: 'text', nullable: true, default: null })
  description?: string | null;

  @Column({ name: 'order_index', type: 'smallint', default: 1 })
  orderIndex?: number;

  @Column({ name: 'start_date', type: 'date', nullable: true, default: null })
  startDate?: string | null;

  @Column({ name: 'end_date', type: 'date', nullable: true, default: null })
  endDate?: string | null;

  @Column({ name: 'self_eval_released', type: 'boolean', default: false })
  selfEvalReleased: boolean;

  @Column({ name: 'peer_eval_released', type: 'boolean', default: false })
  peerEvalReleased: boolean;

  @Column({ name: 'released_at', type: 'timestamptz', nullable: true, default: null })
  releasedAt?: Date | null;

  @Column({ name: 'self_eval_deadline', type: 'timestamptz', nullable: true, default: null })
  selfEvalDeadline?: Date | null;

  @Column({ name: 'peer_eval_deadline', type: 'timestamptz', nullable: true, default: null })
  peerEvalDeadline?: Date | null;

  @Column({ name: 'released_by', type: 'uuid', nullable: true, default: null })
  releasedBy?: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({
    name: 'released_by',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_problems_released_by',
  })
  releaser?: User | null;

  @Index('idx_problems_performance_table_id')
  @Column({ name: 'performance_table_id', type: 'uuid', nullable: true, default: null })
  performanceTableId: string | null;

  @ManyToOne(() => PerformanceTable, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'performance_table_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_problems_performance_table',
  })
  performanceTable: PerformanceTable | null;

  @Index('idx_problems_created_by')
  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({
    name: 'created_by',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_problems_created_by',
  })
  creator: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true, default: null })
  updatedBy: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({
    name: 'updated_by',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_problems_updated_by',
  })
  updater: User | null;

  static create(props: NewProblem): Problem {
    const problem = new Problem();

    problem.roomId = props.roomId?.trim();
    problem.title = props.title?.trim();
    problem.description = props.description ? props.description.trim() : null;
    problem.orderIndex = props.orderIndex;
    problem.startDate = props.startDate ?? null;
    problem.endDate = props.endDate ?? null;
    problem.selfEvalReleased = props.selfEvalReleased ?? false;
    problem.peerEvalReleased = props.peerEvalReleased ?? false;
    problem.releasedAt = props.releasedAt ?? null;
    problem.selfEvalDeadline = props.selfEvalDeadline ?? null;
    problem.performanceTableId = props.performanceTableId ?? null;
    problem.createdBy = props.createdBy?.trim();
    problem.updatedBy = null;

    problem.assertIsValid();

    return problem;
  }

  changeRelease(
    kind: EvaluationReleaseKind,
    change: EvaluationReleaseChange,
    authorId: string,
    now = new Date(),
  ): void {
    if (change.deadline && change.deadline <= now) {
      throw new InvalidProblemError('O prazo deve ser uma data no futuro.');
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

  private assertIsValid(): void {
    if (!this.roomId) {
      throw new InvalidProblemError('A sala do problema é obrigatória.');
    }

    if (!this.createdBy) {
      throw new InvalidProblemError('O autor do problema é obrigatório.');
    }

    if (!this.title || this.title.length === 0) {
      throw new InvalidProblemError('O título do problema é obrigatório.');
    }

    if (this.title.length > 120) {
      throw new InvalidProblemError('O título do problema deve ter no máximo 120 caracteres.');
    }

    if (this.orderIndex !== undefined && this.orderIndex !== null) {
      if (this.orderIndex < 1 || !Number.isInteger(this.orderIndex)) {
        throw new InvalidProblemError('A ordem do problema deve ser um número inteiro positivo.');
      }
    }

    this.assertPeriodIsValid();
  }

  private assertPeriodIsValid(): void {
    if (this.startDate && this.endDate && this.endDate < this.startDate) {
      throw new InvalidProblemError('A data de término não pode ser anterior à data de início.');
    }
  }
}
