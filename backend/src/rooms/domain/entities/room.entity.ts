import type { NewRoom } from './new-room';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
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

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 12, unique: true })
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
    room.code = props.code.trim();
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

    if (!this.code || this.code.length > 12) {
      throw new InvalidRoomError('O código da sala é inválido.');
    }

    if (!this.accessToken || this.accessToken.length > 64) {
      throw new InvalidRoomError('O token de acesso é inválido.');
    }
  }
}
