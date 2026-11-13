import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Room } from '@/rooms/domain/entities/room.entity';
import { User } from '@/users/domain/entities/user.entity';
import { Message } from './message.entity';

@Entity('conversations')
@Unique('uq_conversations_room_tutor_student', ['roomId', 'tutorId', 'studentId'])
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_conversations_room_id')
  @Column({ name: 'room_id', type: 'uuid' })
  roomId: string;

  @ManyToOne(() => Room, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({
    name: 'room_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_conversations_room',
  })
  room?: Room;

  @Index('idx_conversations_tutor_id')
  @Column({ name: 'tutor_id', type: 'uuid' })
  tutorId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({
    name: 'tutor_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_conversations_tutor',
  })
  tutor?: User;

  @Index('idx_conversations_student_id')
  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({
    name: 'student_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_conversations_student',
  })
  student?: User;

  @OneToMany(() => Message, (message) => message.conversation)
  messages?: Message[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
