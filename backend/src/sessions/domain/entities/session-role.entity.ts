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
  'ck_session_roles_role_score',
  '"role_score" IS NULL OR ("role_score" >= 0 AND "role_score" <= 10)',
)
export class SessionRoleAssignment {
  @PrimaryColumn({ name: 'session_id', type: 'uuid' })
  sessionId!: string;

  @PrimaryColumn({ name: 'student_id', type: 'uuid' })
  studentId!: string;

  @Column({ type: 'enum', enum: SessionRole, enumName: 'session_role' })
  role!: SessionRole;

  @Column({
    name: 'role_score',
    type: 'numeric',
    precision: 4,
    scale: 2,
    nullable: true,
  })
  roleScore!: number | null;

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
