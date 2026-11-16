import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

export interface NewCommitmentTerm {
  version: string;
  title: string;
  content: string;
  isCurrent: boolean;
}

@Entity('commitment_terms')
@Unique('uq_commitment_terms_version', ['version'])
@Index('uq_commitment_terms_current', ['isCurrent'], {
  unique: true,
  where: '"is_current" = TRUE',
})
export class CommitmentTerm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  version: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'is_current', type: 'boolean', default: false })
  isCurrent: boolean;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;

  static create(props: NewCommitmentTerm): CommitmentTerm {
    const term = new CommitmentTerm();
    term.version = props.version.trim();
    term.title = props.title.trim();
    term.content = props.content.trim();
    term.isCurrent = props.isCurrent;
    term.createdAt = new Date();
    return term;
  }
}
