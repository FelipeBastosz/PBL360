import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Problem } from '@/problems/domain/entities/problem.entity';
import { Room } from '@/rooms/domain/entities/room.entity';
import { User } from '@/users/domain/entities/user.entity';
import { InvalidProblemDeliveryError } from '../errors/invalid-problem-delivery.error';
import { normalizeDeliveryUrl } from './delivery-url';

export interface NewProblemDelivery {
  roomId: string;
  problemId: string;
  submittedBy: string;
  url: string;
}

@Entity('problem_deliveries')
@Index('uq_problem_deliveries_active_student', ['problemId', 'submittedBy'], {
  unique: true,
  where: 'replaced_at IS NULL',
})
@Index('idx_problem_deliveries_problem_active', ['problemId', 'createdAt', 'id'], {
  where: 'replaced_at IS NULL',
})
@Index('idx_problem_deliveries_room_problem', ['roomId', 'problemId'])
@Index('idx_problem_deliveries_submitted_by', ['submittedBy'])
@Check(
  'chk_problem_deliveries_url_https',
  `char_length(trim(url)) BETWEEN 1 AND 2048 AND url ~* '^https://'`,
)
export class ProblemDelivery {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'pk_problem_deliveries' })
  id!: string;

  @Column({ name: 'room_id', type: 'uuid' })
  roomId!: string;

  @ManyToOne(() => Room, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'room_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_problem_deliveries_room',
  })
  room!: Room;

  @Column({ name: 'problem_id', type: 'uuid' })
  problemId!: string;

  @ManyToOne(() => Problem, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'problem_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_problem_deliveries_problem',
  })
  problem!: Problem;

  @Column({ name: 'submitted_by', type: 'uuid' })
  submittedBy!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'submitted_by',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_problem_deliveries_submitted_by',
  })
  author!: User;

  @Column({ type: 'varchar', length: 2048 })
  url!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'replaced_at', type: 'timestamptz', nullable: true, default: null })
  replacedAt!: Date | null;

  static create(props: NewProblemDelivery): ProblemDelivery {
    const delivery = new ProblemDelivery();
    delivery.roomId = props.roomId?.trim();
    delivery.problemId = props.problemId?.trim();
    delivery.submittedBy = props.submittedBy?.trim();
    delivery.url = normalizeDeliveryUrl(props.url);
    delivery.replacedAt = null;
    delivery.assertReferencesArePresent();
    return delivery;
  }

  private assertReferencesArePresent(): void {
    if (!this.roomId) {
      throw new InvalidProblemDeliveryError('A sala da entrega é obrigatória.');
    }
    if (!this.problemId) {
      throw new InvalidProblemDeliveryError('O problema da entrega é obrigatório.');
    }
    if (!this.submittedBy) {
      throw new InvalidProblemDeliveryError('O autor da entrega é obrigatório.');
    }
  }
}
