import { CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Room } from './room.entity';
import { User } from '@/users/domain/entities/user.entity';

@Entity('room_students')
@Index('idx_room_students_student', ['studentId'])
export class RoomStudent {
  @PrimaryColumn({ name: 'room_id', type: 'uuid' })
  roomId!: string;

  @PrimaryColumn({ name: 'student_id', type: 'uuid' })
  studentId!: string;

  @ManyToOne(() => Room, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'room_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_room_students_room',
  })
  room!: Room;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'student_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_room_students_student',
  })
  student!: User;

  @CreateDateColumn({ name: 'joined_at', type: 'timestamptz' })
  joinedAt!: Date;
}
