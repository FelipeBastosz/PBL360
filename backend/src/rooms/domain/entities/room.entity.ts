import type { NewRoom } from './new-room';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinTable,
  ManyToMany,
  Unique,
} from 'typeorm';
import { InvalidRoomError } from '../errors/invalid-room.error';
import { User } from '@/users/domain/entities/user.entity';

export interface RoomChanges {
  name?: string;
  semester?: string;
  active?: boolean;
}

@Entity('rooms')
@Unique('uq_rooms_room_code', ['roomCode'])
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_rooms_tutor_id')
  @Column({ name: 'tutor_id', type: 'uuid' })
  tutorId: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({
    name: 'tutor_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_rooms_tutor',
  })
  tutor: User;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'room_tutors',

    joinColumn: {
      name: 'room_id',
      referencedColumnName: 'id',
      foreignKeyConstraintName: 'fk_room_tutors_room',
    },

    inverseJoinColumn: {
      name: 'tutor_id',
      referencedColumnName: 'id',
      foreignKeyConstraintName: 'fk_room_tutors_tutor',
    },
  })
  tutors: User[];

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ name: 'course_code', type: 'varchar', length: 12 })
  courseCode: string;

  @Column({ name: 'room_code', type: 'varchar', length: 64 })
  roomCode: string;

  @Column({ type: 'varchar', length: 10 })
  semester: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true, default: null })
  deletedAt?: Date | null;

  static create(props: NewRoom): Room {
    const room = new Room();

    room.tutorId = props.tutorId.trim();
    room.name = props.name.trim();
    room.courseCode = props.courseCode.trim().toUpperCase();
    room.roomCode = props.roomCode.trim();
    room.semester = props.semester.trim();
    room.active = true;

    room.assertIsValid();

    return room;
  }

  public applyChanges(changes: RoomChanges): void {
    this.name = changes.name?.trim() ?? this.name;
    this.semester = changes.semester?.trim() ?? this.semester;
    this.active = changes.active ?? this.active;

    this.assertIsValid();
  }

  public delete(): void {
    if (this.isDeleted()) {
      throw new InvalidRoomError('Esta sala já foi excluída.');
    }
    this.deletedAt = new Date();
    this.active = false;
  }

  public isDeleted(): boolean {
    return this.deletedAt != null;
  }

  private assertIsValid(): void {
    this.assertNameIsValid();
    this.assertSemesterIsValid();
    this.assertAccessDataIsValid();
  }

  private assertNameIsValid(): void {
    if (!this.name) {
      throw new InvalidRoomError('O nome da sala é obrigatório.');
    }

    if (this.name.length > 120) {
      throw new InvalidRoomError('O nome da sala deve ter no máximo 120 caracteres.');
    }
  }

  private assertSemesterIsValid(): void {
    if (!this.semester) {
      throw new InvalidRoomError('O semestre é obrigatório.');
    }

    if (this.semester.length > 10) {
      throw new InvalidRoomError('O semestre deve ter no máximo 10 caracteres.');
    }
  }

  private assertAccessDataIsValid(): void {
    if (!this.tutorId) {
      throw new InvalidRoomError('O professor responsável é obrigatório.');
    }

    if (!/^[A-Z]{3}[0-9]{3}$/.test(this.courseCode)) {
      throw new InvalidRoomError('O código da disciplina deve seguir o formato ABC123.');
    }

    if (!this.roomCode || this.roomCode.length > 64) {
      throw new InvalidRoomError('O código da sala é inválido.');
    }
  }
}
