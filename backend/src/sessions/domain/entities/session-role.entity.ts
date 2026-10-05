import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';
import { User } from '@/users/domain/entities/user.entity';
import { Session } from './session.entity';
import { SessionRole } from '../enums/session-role.enum';

@Entity('session_roles')
@Index('idx_session_roles_student_id', ['studentId'])
@Unique('uq_session_roles_session_role', ['sessionId', 'role'])
@Check(
  'ck_session_roles_bonus_score',
  '"bonus_score" IS NULL OR ("bonus_score" >= 0 AND "bonus_score" <= 1)',
)
export class SessionRoleAssignment {
  @PrimaryColumn({ name: 'session_id', type: 'uuid' })
  sessionId!: string;

  @PrimaryColumn({ name: 'student_id', type: 'uuid' })
  studentId!: string;

  @Column({ type: 'enum', enum: SessionRole, enumName: 'session_role' })
  role!: SessionRole;

  @Column({
    name: 'bonus_score',
    type: 'numeric',
    precision: 3,
    scale: 2,
    nullable: true,
  })
  bonusScore!: number | null;

  @ManyToOne(() => Session, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'session_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_session_roles_session',
  })
  session!: Session;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'student_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_session_roles_student',
  })
  student!: User;
}
