import { CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('room_students')
export class RoomStudent {
  @PrimaryColumn({ name: 'room_id', type: 'uuid' })
  roomId!: string;

  @PrimaryColumn({ name: 'student_id', type: 'uuid' })
  studentId!: string;

  @CreateDateColumn({ name: 'joined_at', type: 'timestamptz' })
  joinedAt!: Date;
}
