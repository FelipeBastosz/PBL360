import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { CommitmentTerm } from './commitment-term.entity';
import { User } from '@/users/domain/entities/user.entity';

export interface NewUserTermAcceptance {
  userId: string;
  termId: string;
  termVersion: string;
  acceptedAt?: Date;
}

@Entity('user_term_acceptances')
@Unique('uq_user_term_acceptances_user', ['userId'])
@Index('idx_user_term_acceptances_user_id', ['userId'])
export class UserTermAcceptance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'user_term_acceptances_user_id_fkey',
  })
  user?: User;

  @Column({ name: 'term_id', type: 'uuid' })
  termId: string;

  @ManyToOne(() => CommitmentTerm, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'term_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'user_term_acceptances_term_id_fkey',
  })
  term?: CommitmentTerm;

  @Column({ name: 'term_version', type: 'varchar', length: 20 })
  termVersion: string;

  @Column({ name: 'accepted_at', type: 'timestamptz', default: () => 'now()' })
  acceptedAt: Date;

  static create(props: NewUserTermAcceptance): UserTermAcceptance {
    const acceptance = new UserTermAcceptance();
    acceptance.userId = props.userId;
    acceptance.termId = props.termId;
    acceptance.termVersion = props.termVersion.trim();
    acceptance.acceptedAt = props.acceptedAt ?? new Date();
    return acceptance;
  }
}
