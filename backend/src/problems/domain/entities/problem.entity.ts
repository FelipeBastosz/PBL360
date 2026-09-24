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
import { Room } from '@/rooms/domain/entities/room.entity';
import { User } from '@/users/domain/entities/user.entity';
import { InvalidProblemError } from '../errors/invalid-problem.error';
import type { NewProblem } from './new-problem';

@Entity('problems')
@Unique('uq_problems_room_order', ['roomId', 'orderIndex'])
export class Problem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_problems_room_id')
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
  orderIndex: number;

  @Column({ name: 'start_date', type: 'date', nullable: true, default: null })
  startDate?: Date | null;

  @Column({ name: 'end_date', type: 'date', nullable: true, default: null })
  endDate?: Date | null;

  @Column({ name: 'self_eval_released', type: 'boolean', default: false })
  selfEvalReleased: boolean;

  @Column({ name: 'peer_eval_released', type: 'boolean', default: false })
  peerEvalReleased: boolean;

  @Column({ name: 'released_at', type: 'timestamptz', nullable: true, default: null })
  releasedAt?: Date | null;

  @Column({ name: 'self_eval_deadline', type: 'timestamptz', nullable: true, default: null })
  selfEvalDeadline?: Date | null;

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
    problem.createdBy = props.createdBy?.trim();

    problem.assertIsValid();

    return problem;
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

    if (this.orderIndex < 1 || !Number.isInteger(this.orderIndex)) {
      throw new InvalidProblemError('A ordem do problema deve ser um número inteiro positivo.');
    }
  }
}
