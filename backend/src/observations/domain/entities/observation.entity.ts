import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Session } from '@/sessions/domain/entities/session.entity';
import { User } from '@/users/domain/entities/user.entity';
import { InvalidObservationError } from '../errors/invalid-observation.error';

export interface ObservationTagRef {
  id: string;
  name: string;
}

@Entity('observations')
@Index('idx_observations_session_student', ['sessionId', 'studentId'])
export class Observation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @ManyToOne(() => Session, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'session_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_observations_session',
  })
  session: Session;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'student_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_observations_student',
  })
  student: User;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'author_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_observations_author',
  })
  author: User;

  @Column({ type: 'text', nullable: true })
  text: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  tags: ObservationTagRef[] = [];

  static register(props: NewObservation): Observation {
    const observation = new Observation();
    observation.sessionId = props.sessionId;
    observation.studentId = props.studentId;
    observation.authorId = props.authorId;
    observation.text = props.text?.trim() || null;
    observation.tags = props.tags;
    if (!observation.text && observation.tags.length === 0) {
      throw new InvalidObservationError('Informe ao menos uma marcação ou um texto.');
    }

    return observation;
  }

  complement(text: string): void {
    const trimmed = text.trim();
    if (!trimmed) throw new InvalidObservationError('O texto da observação é obrigatório.');
    this.text = trimmed;
  }

  isAuthoredBy(tutorId: string): boolean {
    return this.authorId === tutorId;
  }
}

export interface NewObservation {
  sessionId: string;
  studentId: string;
  authorId: string;
  text: string | null;
  tags: ObservationTagRef[];
}
