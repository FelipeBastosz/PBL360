import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';
import { UserType } from '../enums/user-type.enum';
import { InvalidUserError } from '../errors/invalid-user.error';
import type { NewUser } from './new-user';
import { Room } from '@/rooms/domain/entities/room.entity';

const TUTOR_EMAIL = /^[^@\s]+@uefs\.br$/i;

const STUDENT_EMAIL = /^[^@\s]+@discente\.uefs\.br$/i;

const REGISTRATION_NUMBER = /^\d{8}$/;

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 160, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({
    name: 'registration_number',
    type: 'varchar',
    length: 20,
    nullable: true,
    unique: true,
  })
  registrationNumber: string | null;

  @Column({ name: 'photo_url', type: 'varchar', length: 255, nullable: true })
  photoUrl: string | null;

  @Column({ type: 'enum', enum: UserType, enumName: 'user_type' })
  type: UserType;

  @Column({ type: 'boolean', default: false })
  active: boolean;

  @Column({ name: 'token_version', type: 'int', default: 0 })
  tokenVersion: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToMany(() => Room, (room) => room.tutors)
  rooms: Room[];

  static create(props: NewUser): User {
    const user = new User();
    user.name = props.name.trim();
    user.email = props.email.trim().toLowerCase();
    user.passwordHash = props.passwordHash;
    user.type = props.type;
    user.registrationNumber = props.registrationNumber?.trim() || null;
    user.photoUrl = props.photoUrl?.trim() || null;
    user.active = false;
    user.tokenVersion = 0;
    user.assertIsValid();

    return user;
  }

  private assertIsValid(): void {
    this.assertEmailMatchesType();

    if (this.registrationNumber !== null && !REGISTRATION_NUMBER.test(this.registrationNumber)) {
      throw new InvalidUserError('A matrícula deve conter exatamente 8 dígitos.');
    }

    if (this.isStudent()) {
      this.assertStudentProfileIsComplete();
    }
  }

  private assertEmailMatchesType(): void {
    if (this.isTutor() && !TUTOR_EMAIL.test(this.email)) {
      throw new InvalidUserError('Professores devem usar o e-mail institucional @uefs.br.');
    }

    if (this.isStudent() && !STUDENT_EMAIL.test(this.email)) {
      throw new InvalidUserError('Alunos devem usar o e-mail institucional @discente.uefs.br.');
    }
  }

  private assertStudentProfileIsComplete(): void {
    if (this.registrationNumber === null) {
      throw new InvalidUserError('A matrícula é obrigatória para alunos.');
    }

    if (this.photoUrl === null) {
      throw new InvalidUserError('A foto é obrigatória para alunos.');
    }
  }

  isTutor(): boolean {
    return this.type === UserType.TUTOR;
  }

  isStudent(): boolean {
    return this.type === UserType.STUDENT;
  }

  isPendingVerification(): boolean {
    return !this.active;
  }

  activate(): void {
    this.active = true;
  }

  deactivate(): void {
    this.active = false;
    this.revokeSessions();
  }

  changePassword(passwordHash: string): void {
    this.passwordHash = passwordHash;
    this.revokeSessions();
  }

  private revokeSessions(): void {
    this.tokenVersion = (this.tokenVersion ?? 0) + 1;
  }
}
