import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

export interface NewUserTermAcceptance {
  userId: string;
  termId: string;
  termVersion: string;
  acceptedAt?: Date;
}

@Entity('user_term_acceptances')
@Unique('uq_user_term_acceptances_user', ['userId'])
export class UserTermAcceptance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'term_id', type: 'uuid' })
  termId: string;

  @Column({ name: 'term_version', type: 'varchar', length: 20 })
  termVersion: string;

  @Column({ name: 'accepted_at', type: 'timestamptz' })
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
