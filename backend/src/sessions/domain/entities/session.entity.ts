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

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  static create(props: NewSession): Session {
    const session = new Session();
    session.problemId = props.problemId;
    session.title = props.title.trim();
    session.description = props.description?.trim() || null;
    session.date = props.date;
    session.orderIndex = 1;
    session.status = 'agendada';
    return session;
  }

  update(title: string, description: string | null, date: string): void {
    this.title = title.trim();
    this.description = description?.trim() || null;
    this.date = date;
  }
}

export interface NewSession {
  problemId: string;
  title: string;
  description: string | null;
  date: string;
}
