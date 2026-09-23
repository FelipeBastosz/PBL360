import type { NewRoom } from './new-room';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinTable,
  ManyToMany,
} from 'typeorm';
import { InvalidRoomError } from '../errors/invalid-room.error';
import { User } from '@/users/domain/entities/user.entity';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({ type: 'varchar', length: 12 })
  code: string;

  @Column({ name: 'access_token', type: 'varchar', length: 64, unique: true })
  accessToken: string;

  @Column({ type: 'varchar', length: 10 })
  semester: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  static create(props: NewRoom): Room {
    const room = new Room();

    room.tutorId = props.tutorId.trim();
    room.name = props.name.trim();
    room.code = props.code.trim().toUpperCase();
    room.accessToken = props.accessToken.trim();
    room.semester = props.semester.trim();
    room.active = true;

    room.assertIsValid();

    return room;
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

    if (!/^[A-Z]{3}[0-9]{3}$/.test(this.code)) {
      throw new InvalidRoomError('O código da turma deve seguir o formato EXA123.');
    }

    if (!this.accessToken || this.accessToken.length > 64) {
      throw new InvalidRoomError('O token de acesso é inválido.');
    }
  }
}
