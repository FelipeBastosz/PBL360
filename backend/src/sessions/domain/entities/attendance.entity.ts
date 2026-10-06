import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '@/users/domain/entities/user.entity';
import { AttendanceStatus } from '../enums/attendance-status.enum';
import { Session } from './session.entity';

@Entity('attendances')
@Index('idx_attendances_student_id', ['studentId'])
@Unique('uq_attendances_session_student', ['sessionId', 'studentId'])
@Unique('uq_attendances_session_seat', ['sessionId', 'seatNumber'])
@Check('ck_attendances_seat_positive', 'seat_number IS NULL OR seat_number >= 1')
@Check(
  'ck_attendances_seat_only_when_present',
  `seat_number IS NULL OR status IN ('PRESENT', 'LATE')`,
)
@Check(
  'ck_attendances_justification_only_when_excused',
  `justification IS NULL OR status = 'EXCUSED'`,
)
export class Attendance {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'pk_attendances' })
  id!: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId!: string;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId!: string;

  @Column({ name: 'recorded_by', type: 'uuid' })
  recordedBy!: string;

  @Column({ type: 'enum', enum: AttendanceStatus, enumName: 'attendance_status' })
  status!: AttendanceStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  justification!: string | null;

  @Column({ name: 'seat_number', type: 'smallint', nullable: true })
  seatNumber!: number | null;

  @CreateDateColumn({ name: 'recorded_at', type: 'timestamptz' })
  recordedAt!: Date;

  @ManyToOne(() => Session, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'session_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_attendances_session',
  })
  session!: Session;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'student_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_attendances_student',
  })
  student!: User;

  @ManyToOne(() => User, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({
    name: 'recorded_by',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_attendances_recorded_by',
  })
  recorder!: User;
}
